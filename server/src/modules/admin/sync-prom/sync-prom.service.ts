import * as _ from 'lodash';
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
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

  private async authDoc() {
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

  private async findRowBy(
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

  private mapEntityFields(mapRecord: string[][], entity: Record<string, any>) {
    return Object.fromEntries(
      _.map(mapRecord, ([keyInTable, keyInEntity]) => {
        return [keyInTable, _.get(entity, keyInEntity)];
      }),
    );
  }

  public async getCategoriesSheet() {
    const { groupsSheet } = await this.authDoc();
    return groupsSheet;
  }

  public async getProductsSheet() {
    const { productsSheet } = await this.authDoc();
    return productsSheet;
  }

  public async loadAllCategories() {
    const categoriesSheet = await this.getCategoriesSheet();

    const limit = 50;
    const result = {
      count: 0,
      added: 0,
      updated: 0,
      success: true,
    };

    const count = await this.categoryModel.count({ sync: false });
    this.logger.debug('Not synced Categories count in DB', { count });
    if (count === 0) {
      return result;
    }

    // RESULT
    result.count = count;

    let offset = 0;
    while (offset <= count) {
      // LOAD
      this.logger.debug('Load not synced Categories from DB:', {
        limit,
        offset,
      });

      const categories = await this.categoryModel
        .find({ sync: false })
        .skip(offset)
        .limit(limit);
      this.logger.debug('Loaded not synced Categories:', {
        count: categories.length,
      });

      // ADD TO SHEET
      this.logger.debug('Build bulk rows for Google Sheet');
      const bulkRows = _.map(categories, (category) =>
        this.mapEntityFields(
          AppConstants.Prom.Sheet.CategoryFieldsMapping,
          category,
        ),
      );

      this.logger.debug('Add rows with Categories to Google Sheet:', {
        count: bulkRows.length,
      });

      const addedRows = await categoriesSheet.addRows(bulkRows);
      this.logger.debug('Added rows to Google Sheet:', {
        count: addedRows.length,
      });

      // RESULT
      result.added += addedRows.length;

      // UPDATE
      this.logger.debug('Update selected Categories in DB:', {
        ids: _.map(categories, '_id'),
        count: categories.length,
      });

      const updatedCategoryIds = await Promise.all(
        _.map(addedRows, async (row) => {
          const categoryId = new Types.ObjectId(row['Идентификатор_группы']);
          const updatedCategory = await this.categoryModel.findOneAndUpdate(
            {
              _id: categoryId,
            },
            {
              $set: {
                sync: true,
                promTableLine: row.rowIndex,
              },
            },
          );

          return updatedCategory._id;
        }),
      );
      this.logger.debug('Updated Categories in DB:', {
        ids: updatedCategoryIds,
        count: updatedCategoryIds.length,
      });

      // RESULT
      result.updated += updatedCategoryIds.length;

      offset += limit;
    }

    const success = _.isEqual(
      _.uniq([result.count, result.added, result.updated]).length,
      1,
    );
    return {
      ...result,
      success,
    };
  }
}
