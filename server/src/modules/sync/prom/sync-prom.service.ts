import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from '@schemas/category';
import { AppConstants } from '../../../app.constants';
import { SpreadsheetService } from '../../spreadsheet/spreadsheet.service';
import { DataUtilsHelper } from '@common/helpers';
import { CrmCategoriesService } from '../../crm/categories/categories.service';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';

@Injectable()
export class SyncPromService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private spreadsheetService: SpreadsheetService,
    private crmCategoriesService: CrmCategoriesService,
    private dataUtilsHelper: DataUtilsHelper,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  private mapEntityFields(mapRecord: string[][], entity: Record<string, any>) {
    return Object.fromEntries(
      _.map(mapRecord, ([keyInTable, keyInEntity]) => {
        return [keyInTable, _.get(entity, keyInEntity)];
      }),
    );
  }

  public async getCountOfNewCategoriesInDB() {
    return this.categoryModel.count({ sync: false });
  }

  public async getNewCategoriesInDB(offset: number, limit: number) {
    return this.categoryModel.find({ sync: false }).skip(offset).limit(limit);
  }

  public async getDeletedCategoriesFromDB(idKey: string) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Load Category ids from Google Sheet');
    const allRows = await this.spreadsheetService.getAllRows(categoriesSheet);
    const categoryIdsInSheet = _.map(allRows, (row) => row[idKey]);

    this.logger.debug(
      'Load Category ids from DB by Category ids from Google Sheet',
    );
    const categories = await this.categoryModel
      .find({
        _id: { $in: categoryIdsInSheet },
      })
      .select({
        _id: 1,
      });
    const categoryIdsInDB = _.map(categories, (category) =>
      category._id.toString(),
    );

    const { removed: removedIds } = this.dataUtilsHelper.getDiff(
      categoryIdsInDB,
      categoryIdsInSheet,
    );
    this.logger.debug('Detected removed Category ids:', {
      removedIds,
    });

    return _.filter(allRows, (row) => _.includes(removedIds, row[idKey]));
  }

  public async addCategoriesToSheet(categories: Category[]) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

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

    const addedRows = await this.spreadsheetService.addRows(
      categoriesSheet,
      bulkRows,
    );
    this.logger.debug('Added rows to Google Sheet:', {
      count: addedRows.length,
    });

    return addedRows;
  }

  public async syncCategoriesWithSheet(categories: Category[]) {
    // ADD TO SHEET
    const addedRows = await this.addCategoriesToSheet(categories);

    // UPDATE IN DB
    this.logger.debug('Update Categories in DB:', {
      ids: _.map(categories, '_id'),
      count: categories.length,
    });

    const updatedCategories = await Promise.all(
      _.map(addedRows, async (row) => {
        return this.crmCategoriesService.updateCategoryInDB(
          new Types.ObjectId(row['Идентификатор_группы']),
          {
            sync: true,
            promTableLine: row.rowIndex,
          },
        );
      }),
    );
    this.logger.debug('Updated Categories in DB:', {
      ids: _.map(updatedCategories, '_id'),
      count: updatedCategories.length,
    });

    return {
      addedRows,
      updatedCategories,
    };
  }

  public async deleteCategoriesFromSheet(categories: GoogleSpreadsheetRow[]) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Remove Categories from Google Sheet', {
      count: categories.length,
    });

    const removedCategoriesFromSheet = await this.spreadsheetService.removeRows(
      categoriesSheet,
      categories,
    );
    this.logger.debug('Removed Categories from Google Sheet:', {
      categories: _.map(removedCategoriesFromSheet, (category) => ({
        id: category['Идентификатор_группы'],
        name: category['Название_группы'],
      })),
      count: removedCategoriesFromSheet.length,
    });

    return removedCategoriesFromSheet;
  }

  public async loadAllNewCategoriesToSheet() {
    const limit = 50;
    const result = {
      newCategoriesCount: 0,
      addedRows: 0,
      updatedCategories: 0,
      success: true,
    };

    const count = await this.getCountOfNewCategoriesInDB();
    this.logger.debug('Not synced Categories count in DB', { count });
    if (count === 0) {
      return result;
    }

    // RESULT
    result.newCategoriesCount = count;

    let offset = 0;
    while (offset <= count) {
      // LOAD
      this.logger.debug('Load not synced Categories from DB:', {
        limit,
        offset,
      });

      const categories = await this.getNewCategoriesInDB(offset, limit);
      this.logger.debug('Loaded not synced Categories:', {
        count: categories.length,
      });

      // ADD TO SHEET
      const { addedRows, updatedCategories } =
        await this.syncCategoriesWithSheet(categories);

      // RESULT
      result.addedRows += addedRows.length;
      result.updatedCategories += updatedCategories.length;

      offset += limit;
    }

    const success = _.isEqual(
      _.uniq([
        result.newCategoriesCount,
        result.addedRows,
        result.updatedCategories,
      ]).length,
      1,
    );
    return {
      ...result,
      success,
    };
  }

  public async syncAllCategoriesWithSheet(add = true, remove = true) {
    if (!add && !remove) {
      throw new HttpException('Nothing for to do', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug('Sync Prom actions:', {
      add,
      remove,
    });

    const result = {
      addedRows: 0,
      updatedCategories: 0,
      removedRows: 0,
    };

    if (remove) {
      // SELECT
      const idKey = 'Идентификатор_группы';
      const deletedCategories = await this.getDeletedCategoriesFromDB(idKey);

      // REMOVE
      if (!_.isEmpty(deletedCategories)) {
        const removedCategoriesFromSheet = await this.deleteCategoriesFromSheet(
          deletedCategories,
        );

        // RESULT
        result.removedRows = removedCategoriesFromSheet.length;
      } else {
        this.logger.debug(
          'Not found deleted Categories between DB and Google Sheet',
        );
      }
    }

    if (add) {
      const { addedRows, updatedCategories } =
        await this.loadAllNewCategoriesToSheet();

      // RESULT
      result.addedRows = addedRows;
      result.updatedCategories = updatedCategories;
    }

    return result;
  }
}
