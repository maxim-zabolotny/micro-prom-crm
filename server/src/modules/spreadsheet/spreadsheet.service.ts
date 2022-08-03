/*external modules*/
import * as _ from 'lodash';
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
  PaginationOptions,
  ServiceAccountCredentials,
} from 'google-spreadsheet';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConstants } from '../../app.constants';
import { TimeHelper } from '@common/helpers';

@Injectable()
export class SpreadsheetService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  private doc: GoogleSpreadsheet;
  private readonly docCredentials: ServiceAccountCredentials;
  private readonly docLimits = {
    requestLimitPerMinute: 300,
    sleepTimeMS: 550,
    countOfRequests: 0,
    lastWaitTimestamp: Date.now(),
  };

  constructor(
    private configService: ConfigService,
    private timeHelper: TimeHelper,
  ) {
    this.docCredentials = {
      client_email: this.configService.get('google.serviceAccountEmail'),
      private_key: this.configService
        .get('google.privateKey')
        .replaceAll('\\n', '\n'),
    };
  }

  async onModuleInit() {
    this.doc = new GoogleSpreadsheet(AppConstants.Google.Sheet.ID);

    this.logger.debug('Auth in Google Sheet');
    await this.doc.useServiceAccountAuth(this.docCredentials);

    this.logger.debug('Load Google Sheet info');
    await this.doc.loadInfo();
  }

  private async checkRequestLimitsAndWait() {
    const now = Date.now();
    const halfOfMinute = 1000 * 30;
    const requestLimitPerHalfOfMinute =
      this.docLimits.requestLimitPerMinute / 2;
    const timestampsDiff = now - this.docLimits.lastWaitTimestamp;

    // Limit was used in less or a one half of minute. Need to sleep
    if (
      timestampsDiff <= halfOfMinute &&
      this.docLimits.countOfRequests >= requestLimitPerHalfOfMinute
    ) {
      this.logger.debug(
        `Request limit used. Sleep ${this.docLimits.sleepTimeMS}ms:`,
        {
          requestLimitPerHalfOfMinute,
          countOfRequests: this.docLimits.countOfRequests,
        },
      );

      await this.timeHelper.sleep(this.docLimits.sleepTimeMS);

      this.docLimits.countOfRequests = 0;
      this.docLimits.lastWaitTimestamp = Date.now();

      return;
    }

    // Limit didn't be use in a one half of minute. Need update timestamp
    if (
      timestampsDiff >= halfOfMinute &&
      this.docLimits.countOfRequests < requestLimitPerHalfOfMinute
    ) {
      this.logger.debug(`Request limit didn't be use. Update requests info:`, {
        requestLimitPerHalfOfMinute,
        countOfRequests: this.docLimits.countOfRequests,
      });

      this.docLimits.countOfRequests = 0;
      this.docLimits.lastWaitTimestamp = Date.now();

      return;
    }
  }

  private async increaseRequestCountsAndWait(count = 1) {
    this.docLimits.countOfRequests += count;
    await this.checkRequestLimitsAndWait();
  }

  private async iterateByRows(
    sheet: GoogleSpreadsheetWorksheet,
    func: (rows: GoogleSpreadsheetRow[]) => boolean,
    options?: PaginationOptions,
  ) {
    const limit = options?.limit ?? 20;
    const countOfRows = sheet.rowCount;

    this.logger.debug('Iterate rows settings:', {
      limit,
      countOfRows,
    });

    // LIMITS
    await this.checkRequestLimitsAndWait();

    let offset = options?.offset ?? 0;
    while (offset <= countOfRows) {
      this.logger.debug('Request rows:', {
        limit,
        offset,
      });

      const rows = await sheet.getRows({ limit, offset });
      if (_.isEmpty(rows)) {
        this.logger.debug('No more rows');
        break;
      }

      // LIMITS
      await this.increaseRequestCountsAndWait();

      const needContinue = func(rows);
      if (!needContinue) {
        this.logger.debug('Break rows iteration');
        break;
      }

      offset += limit;
    }
  }

  public async getAllRows(sheet: GoogleSpreadsheetWorksheet, keys?: string[]) {
    const result = [];

    await this.iterateByRows(sheet, (rows) => {
      if (!_.isEmpty(keys)) {
        result.push(
          ..._.map(rows, (row) =>
            _.reduce(
              keys,
              (acc, key) => {
                acc[key] = row[key];
                return acc;
              },
              {},
            ),
          ),
        );
      } else {
        result.push(...rows);
      }

      return true;
    });

    return result;
  }

  public async findOneRowBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Record<string, string | number>,
    options?: PaginationOptions,
  ) {
    this.logger.debug('Find rows by:', {
      data,
    });

    let result = null;

    await this.iterateByRows(
      sheet,
      (rows) => {
        const targetRow = _.find(rows, (row) => {
          return _.every(data, (value, key) => {
            return row[key] === String(value);
          });
        });
        if (targetRow) {
          result = targetRow;
          return false;
        }

        this.logger.debug('Target row not found. Continue');
        return true;
      },
      options,
    );

    return result;
  }

  public async findRowsBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Array<Record<string, string | number>>,
    options?: PaginationOptions,
  ) {
    this.logger.debug('Find rows by:', {
      data,
    });

    const result = [];

    await this.iterateByRows(
      sheet,
      (rows) => {
        const targetRows = _.filter(rows, (row) => {
          return _.some(data, (condition) => {
            return _.every(condition, (value, key) => {
              return row[key] === String(value);
            });
          });
        });
        if (!_.isEmpty(targetRows)) result.push(...targetRows);

        return true;
      },
      options,
    );

    return result;
  }

  public async removeOneRowBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Record<string, string | number>,
    options?: PaginationOptions,
  ) {
    const row = await this.findOneRowBy(sheet, data, options);
    if (!row) {
      throw new HttpException(
        `Row doesn't exist in table`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await row.delete();

    // LIMITS
    await this.increaseRequestCountsAndWait();

    return row;
  }

  public async removeRowsBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Array<Record<string, string | number>>,
    options?: PaginationOptions,
  ) {
    const rows = await this.findRowsBy(sheet, data, options);
    if (_.isEmpty(rows)) {
      throw new HttpException(
        `Rows don't exist in table`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const chunkedRows = _.chunk(rows, this.docLimits.requestLimitPerMinute / 2);
    for (const rows of chunkedRows) {
      await Promise.all(_.map(rows, (row) => row.delete()));

      // LIMITS
      await this.increaseRequestCountsAndWait(rows.length);
    }

    return rows;
  }

  public setRequestLimits(count: number) {
    this.docLimits.requestLimitPerMinute = count;
  }

  public setDefaultRequestLimits() {
    this.docLimits.requestLimitPerMinute = 300;
  }

  public getPaginationForRowIndex(rowIndex: number): PaginationOptions {
    return {
      offset: rowIndex - 2,
      limit: 1,
    };
  }

  public getProductsSheet() {
    return this.doc.sheetsByIndex[0];
  }

  public getCategoriesSheet() {
    return this.doc.sheetsByIndex[1];
  }

  public getDoc() {
    return this.doc;
  }
}
