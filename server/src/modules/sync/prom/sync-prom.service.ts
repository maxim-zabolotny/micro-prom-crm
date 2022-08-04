import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from '@schemas/category';
import { AppConstants } from '../../../app.constants';
import { SpreadsheetService } from '../../spreadsheet/spreadsheet.service';
import { DataUtilsHelper } from '@common/helpers';

export interface IDeletedCategoryInfo {
  id: string;
  rowIndex: number;
}

@Injectable()
export class SyncPromService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private spreadsheetService: SpreadsheetService,
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

  public async getDeletedCategoriesFromDB(
    idKey: string,
  ): Promise<IDeletedCategoryInfo[]> {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Load Category ids from Google Sheet');
    const allRows = await this.spreadsheetService.getAllRows(categoriesSheet, [
      idKey,
      'rowIndex',
    ]);
    const categoryIdsInSheet = _.map(allRows, idKey);

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

    return _.chain(allRows)
      .filter((row) => _.includes(removedIds, row[idKey]))
      .map((row) => ({ id: row[idKey], rowIndex: Number(row.rowIndex) }))
      .value();
  }

  public async deleteCategoriesFromSheet(
    categories: IDeletedCategoryInfo[],
    idKey: string,
  ) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Remove Categories from Google Sheet');

    const removedCategoriesFromSheet = await Promise.all(
      _.map(categories, (category) => {
        return this.spreadsheetService.removeOneRowBy(
          categoriesSheet,
          {
            [idKey]: category.id,
          },
          this.spreadsheetService.getPaginationForRowIndex(category.rowIndex),
        );
      }),
    );
    this.logger.debug('Removed Categories from Google Sheet:', {
      categories: _.map(removedCategoriesFromSheet, (category) => ({
        id: category['Идентификатор_группы'],
        name: category['Название_группы'],
      })),
    });

    return removedCategoriesFromSheet;
  }

  public async getNewCategoriesInDB(offset: number, limit: number) {
    return this.categoryModel.find({ sync: false }).skip(offset).limit(limit);
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
    this.logger.debug('Update selected Categories in DB:', {
      ids: _.map(categories, '_id'),
      count: categories.length,
    });

    const updatedCategories = await Promise.all(
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

        return updatedCategory;
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

  public async loadAllNewCategoriesToSheet() {
    const limit = 50;
    const result = {
      count: 0,
      added: 0,
      updated: 0,
      success: true,
    };

    const count = await this.getCountOfNewCategoriesInDB();
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

      const categories = await this.getNewCategoriesInDB(offset, limit);
      this.logger.debug('Loaded not synced Categories:', {
        count: categories.length,
      });

      // ADD TO SHEET
      const { addedRows, updatedCategories } =
        await this.syncCategoriesWithSheet(categories);

      // RESULT
      result.added += addedRows.length;
      result.updated += updatedCategories.length;

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

  public async syncAllCategoriesWithSheet(add = true, remove = true) {
    if (!add && !remove) {
      throw new HttpException('Nothing for to do', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug('Sync Prom actions:', {
      add,
      remove,
    });

    const result = {
      removed: 0,
      added: 0,
      updated: 0,
    };

    if (remove) {
      // SELECT
      const idKey = 'Идентификатор_группы';
      const deletedCategories = await this.getDeletedCategoriesFromDB(idKey);

      // REMOVE
      if (!_.isEmpty(deletedCategories)) {
        const removedCategoriesFromSheet = await this.deleteCategoriesFromSheet(
          deletedCategories,
          idKey,
        );

        // RESULT
        result.removed = removedCategoriesFromSheet.length;
      } else {
        this.logger.debug(
          'Not found deleted categories between DB and Google Sheet',
        );
      }
    }

    if (add) {
      const { added, updated } = await this.loadAllNewCategoriesToSheet();

      // RESULT
      result.added = added;
      result.updated = updated;
    }

    return result;
  }
}
