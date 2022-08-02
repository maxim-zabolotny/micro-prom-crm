import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from '@schemas/category';
import { AppConstants } from '../../../app.constants';
import { SpreadsheetService } from '../../spreadsheet/spreadsheet.service';

@Injectable()
export class SyncPromService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private spreadsheetService: SpreadsheetService,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  private mapEntityFields(mapRecord: string[][], entity: Record<string, any>) {
    return Object.fromEntries(
      _.map(mapRecord, ([keyInTable, keyInEntity]) => {
        return [keyInTable, _.get(entity, keyInEntity)];
      }),
    );
  }

  public async loadAllCategories() {
    const categoriesSheet = await this.spreadsheetService.getCategoriesSheet();

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
