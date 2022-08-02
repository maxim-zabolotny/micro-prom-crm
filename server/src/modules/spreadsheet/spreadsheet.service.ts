/*external modules*/
import * as _ from 'lodash';
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
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

@Injectable()
export class SpreadsheetService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  private doc: GoogleSpreadsheet;
  private readonly docCredentials: ServiceAccountCredentials;

  constructor(private configService: ConfigService) {
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

  private async iterateByRows(
    sheet: GoogleSpreadsheetWorksheet,
    func: (rows: GoogleSpreadsheetRow[]) => boolean,
  ) {
    const limit = 20;
    const countOfRows = sheet.rowCount;

    this.logger.debug('Iterate rows settings:', {
      limit,
      countOfRows,
    });

    let offset = 0;
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
  ) {
    this.logger.debug('Find rows by:', {
      data,
    });

    let result = null;

    await this.iterateByRows(sheet, (rows) => {
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
    });

    return result;
  }

  public async findRowsBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Array<Record<string, string | number>>,
  ) {
    this.logger.debug('Find rows by:', {
      data,
    });

    const result = [];

    await this.iterateByRows(sheet, (rows) => {
      const targetRows = _.filter(rows, (row) => {
        return _.some(data, (condition) => {
          return _.every(condition, (value, key) => {
            return row[key] === String(value);
          });
        });
      });
      if (!_.isEmpty(targetRows)) result.push(...targetRows);

      return true;
    });

    return result;
  }

  public async removeOneRowBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Record<string, string | number>,
  ) {
    const row = await this.findOneRowBy(sheet, data);
    if (!row) {
      throw new HttpException(
        `Row doesn't exist in table`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await row.delete();

    return row;
  }

  public async removeRowsBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Array<Record<string, string | number>>,
  ) {
    const rows = await this.findRowsBy(sheet, data);
    if (_.isEmpty(rows)) {
      throw new HttpException(
        `Rows don't exist in table`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await Promise.all(_.map(rows, (row) => row.delete()));

    return rows;
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
