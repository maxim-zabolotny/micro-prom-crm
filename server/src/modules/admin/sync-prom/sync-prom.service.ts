import * as _ from 'lodash';
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from '@schemas/category';
import { AppConstants } from '../../../app.constants';

@Injectable()
export class SyncPromService {
  private readonly logger = new Logger(this.constructor.name);

  private doc!: GoogleSpreadsheet;
  private isAuthenticated = false;

  constructor(
    private configService: ConfigService,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  public async authDoc() {
    if (!this.isAuthenticated) {
      this.doc = new GoogleSpreadsheet(AppConstants.Google.Sheet.ID);

      this.logger.debug('Auth in Google Sheet');
      await this.doc.useServiceAccountAuth({
        client_email: this.configService.get('google.serviceAccountEmail'),
        private_key: this.configService
          .get('google.privateKey')
          .replaceAll('\\n', '\n'),
      });

      this.logger.debug('Load Google Sheet info');
      await this.doc.loadInfo();

      this.isAuthenticated = true;

      return {
        productsSheet: this.doc.sheetsByIndex[0],
        groupsSheet: this.doc.sheetsByIndex[1],
      };
    }

    return {
      productsSheet: this.doc.sheetsByIndex[0],
      groupsSheet: this.doc.sheetsByIndex[1],
    };
  }

  public async findRowBy(
    sheet: GoogleSpreadsheetWorksheet,
    data: Record<string, string | number>,
  ) {
    const limit = 20;
    const countOfRows = sheet.rowCount;

    this.logger.debug('Find row by:', {
      limit,
      countOfRows,
      data,
    });

    let offset = 0;
    while (offset <= countOfRows) {
      this.logger.debug('Request rows:', {
        limit,
        offset,
      });

      const rows = await sheet.getRows({ limit, offset });
      if (_.isEmpty(rows)) {
        this.logger.debug('Target row not found. No more rows');
        break;
      }

      const targetRow = _.find(rows, (row) => {
        return _.every(data, (value, key) => {
          return row[key] === String(value);
        });
      });
      if (targetRow) return targetRow;

      this.logger.debug('Target row not found. Continue');
      offset += limit;
    }

    return null;
  }

  public async loadAllCategories() {
    this.logger.debug('Load Categories from DB');
    const categories = await this.categoryModel.find();

    console.log('categories => ', categories);
    console.log('categories => ', categories.length);

    await this.authDoc();
  }
}
