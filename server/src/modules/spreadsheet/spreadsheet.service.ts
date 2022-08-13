/*external modules*/
import * as _ from 'lodash';
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
  PaginationOptions,
  ServiceAccountCredentials,
  WorksheetGridRange,
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
    requestLimitPerMinute: 300, // todo: google returned  { "quota_limit_value": "60" }
    intervalForChecksRequestLimit: 60,
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

    // HACK FOR MAX DATA
    const googleSpreadsheetAxios = this.doc['axios'];
    const axiosDefaults = googleSpreadsheetAxios['defaults'];

    axiosDefaults.maxContentLength = Infinity;
    axiosDefaults.maxBodyLength = Infinity;

    // ERROR HANDLING HINT
    googleSpreadsheetAxios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 429) {
          this.logger.error('Request limit Google Sheet error:', {
            message: error.message,
            status: error.response.status,
            statusText: error.response.statusText,
            error: error.response.data.error ?? error.response.data,
          });

          const timeToSleep = 1000 * 20;

          const now = Date.now();
          const timestampsDiff = Math.floor(
            (now - this.docLimits.lastWaitTimestamp) / 1000,
          );

          this.logger.log(`Sleep and repeat request:`, {
            timeToSleep: timeToSleep / 1000,
            countOfRequests: this.docLimits.countOfRequests,
            timestampNow: now,
            lastWaitTimestamp: this.docLimits.lastWaitTimestamp,
            timestampsDiff: timestampsDiff,
          });

          await this.timeHelper.sleep(timeToSleep);

          this.docLimits.countOfRequests = 0;
          this.docLimits.lastWaitTimestamp = Date.now();

          return googleSpreadsheetAxios.request(error.config);
        }

        return Promise.reject(error);
      },
    );

    this.logger.debug('Auth in Google Sheet');
    await this.doc.useServiceAccountAuth(this.docCredentials);

    this.logger.debug('Load Google Sheet info');
    await this.doc.loadInfo();
  }

  private async checkRequestLimitsAndWait() {
    // TODO: it doesn't work
    return;

    const now = Date.now();
    const oneMinute = 1000 * 60;

    const { intervalForChecksRequestLimit, requestLimitPerMinute } =
      this.docLimits;

    const timeInterval = oneMinute / intervalForChecksRequestLimit;
    const requestsCountForInterval = Math.floor(
      requestLimitPerMinute / intervalForChecksRequestLimit,
    );

    const timestampsDiff = now - this.docLimits.lastWaitTimestamp;
    const timeToSleep =
      1000 * (requestLimitPerMinute / this.docLimits.countOfRequests); // bug here

    switch (true) {
      case timestampsDiff <= timeInterval &&
        this.docLimits.countOfRequests >= requestsCountForInterval: {
        // Limit was used in less or a one half of minute. Need to sleep

        this.logger.log(`Request limit used. Sleep ${timeToSleep / 1000}s:`, {
          timeInterval,
          requestsCountForInterval,
          timeToSleep: timeToSleep / 1000,
          countOfRequests: this.docLimits.countOfRequests,
        });

        await this.timeHelper.sleep(timeToSleep);

        this.docLimits.countOfRequests = 0;
        this.docLimits.lastWaitTimestamp = Date.now();

        return;
      }
      case timestampsDiff >= timeInterval &&
        this.docLimits.countOfRequests < requestsCountForInterval: {
        // Limit didn't be use in a one half of minute. Need update timestamp

        this.logger.log(`Request limit didn't be use. Update requests info:`, {
          timeInterval,
          requestsCountForInterval,
          countOfRequests: this.docLimits.countOfRequests,
        });

        this.docLimits.countOfRequests = 0;
        this.docLimits.lastWaitTimestamp = Date.now();

        return;
      }
    }
  }

  private async increaseRequestCountsAndWait(count = 1) {
    this.docLimits.countOfRequests += count;
    // await this.checkRequestLimitsAndWait();
  }

  private async iterateByRows(
    sheet: GoogleSpreadsheetWorksheet,
    func: (rows: GoogleSpreadsheetRow[]) => boolean,
    options?: Partial<PaginationOptions>,
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

  public async getAllRows(
    sheet: GoogleSpreadsheetWorksheet,
    options?: Partial<PaginationOptions>,
  ) {
    this.logger.debug('Get all rows');

    const result: GoogleSpreadsheetRow[] = [];

    await this.iterateByRows(
      sheet,
      (rows) => {
        result.push(...rows);
        return true;
      },
      options,
    );

    this.logger.debug('Received all rows:', {
      count: result.length,
    });

    return _.orderBy(result, (row) => row.rowIndex, ['desc']);
  }

  public async findOneRowBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Record<string, string | number>,
    options?: Partial<PaginationOptions>,
  ) {
    this.logger.debug('Find row by:', {
      data,
      options,
    });

    let result: GoogleSpreadsheetRow | null = null;

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

    this.logger.debug('Found row:', {
      data,
      found: Boolean(result),
    });

    return result;
  }

  public async findRowsBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Array<Record<string, string | number>>,
    options?: Partial<PaginationOptions>,
  ) {
    this.logger.debug('Find rows by:', {
      data,
      options,
    });

    const result: GoogleSpreadsheetRow[] = [];

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

    this.logger.debug('Found rows:', {
      data,
      count: result.length,
    });

    return _.orderBy(result, (row) => row.rowIndex, ['desc']);
  }

  public async addRows(
    sheet: GoogleSpreadsheetWorksheet,
    data: Array<Record<string, any>>,
  ) {
    this.logger.debug('Add rows:', {
      count: data.length,
    });

    // LIMITS
    await this.checkRequestLimitsAndWait();

    const rows = await sheet.addRows(data);

    this.logger.debug('Added rows:', {
      count: rows.length,
    });

    // LIMITS
    await this.increaseRequestCountsAndWait();

    return rows;
  }

  public async removeOneRowBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Record<string, string | number>,
    options?: Partial<PaginationOptions>,
  ) {
    this.logger.debug('Remove row by:', {
      data,
      options,
    });

    const row = await this.findOneRowBy(sheet, data, options);
    if (!row) {
      throw new HttpException(
        `Row doesn't exist in table`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // LIMITS
    await this.checkRequestLimitsAndWait();

    await row.delete();

    this.logger.debug('Removed row:', {
      rowIndex: row.rowIndex,
    });

    // LIMITS
    await this.increaseRequestCountsAndWait();

    return row;
  }

  public async removeRowsBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Array<Record<string, string | number>>,
    options?: Partial<PaginationOptions>,
  ) {
    this.logger.debug('Remove rows by:', {
      data,
      options,
    });

    const rows = await this.findRowsBy(sheet, data, options);
    if (_.isEmpty(rows)) {
      throw new HttpException(
        `Rows don't exist in table`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // LIMITS
    await this.checkRequestLimitsAndWait();

    for (const row of rows) {
      await row.delete();

      this.logger.debug('Removed row:', {
        rowIndex: row.rowIndex,
      });

      // LIMITS
      await this.increaseRequestCountsAndWait();
    }

    this.logger.debug('Removed rows:', {
      rowIndexes: _.map(rows, (row) => row.rowIndex),
      count: rows.length,
    });

    return rows;
  }

  public async removeRows(
    sheet: GoogleSpreadsheetWorksheet,
    rows: GoogleSpreadsheetRow[],
  ) {
    this.logger.debug('Remove rows:', {
      rowIndexes: _.map(rows, (row) => row.rowIndex),
      count: rows.length,
    });

    // LIMITS
    await this.checkRequestLimitsAndWait();

    const removedRows: GoogleSpreadsheetRow[] = [];

    const orderedRows = _.orderBy(rows, (row) => row.rowIndex, ['desc']);
    for (const row of orderedRows) {
      await row.delete();
      removedRows.push(row);

      this.logger.debug('Removed row:', {
        rowIndex: row.rowIndex,
      });

      // LIMITS
      await this.increaseRequestCountsAndWait();
    }

    this.logger.debug('Removed rows:', {
      rowIndexes: _.map(removedRows, (row) => row.rowIndex),
      count: removedRows.length,
    });

    return removedRows;
  }

  public async updateCells(
    sheet: GoogleSpreadsheetWorksheet,
    range: WorksheetGridRange,
    callback: () => Promise<void>,
  ) {
    this.logger.debug('Load cells:', {
      range,
    });

    // LIMITS
    await this.checkRequestLimitsAndWait();

    await sheet.loadCells(range);

    // LIMITS
    await this.increaseRequestCountsAndWait();

    await callback();

    this.logger.debug('Save updated cells');
    await sheet.saveUpdatedCells();

    // LIMITS
    await this.increaseRequestCountsAndWait();
  }

  public async clearRows(
    sheet: GoogleSpreadsheetWorksheet,
    start: number,
    end: number,
  ) {
    this.logger.debug('Clear rows:', {
      start,
      end,
    });

    // LIMITS
    await this.checkRequestLimitsAndWait();

    await sheet.clearRows({ start, end });
    this.logger.debug('Rows cleared');

    // LIMITS
    await this.increaseRequestCountsAndWait();
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
