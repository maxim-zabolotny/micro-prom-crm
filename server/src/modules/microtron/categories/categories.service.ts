import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MicrotronAPI from '@lib/microtron';
import { Category } from '@lib/microtron/core/category';
import {
  ICategory,
  ICategoriesTree,
} from '@lib/microtron/core/category/ICategorie';
import {
  Constant,
  ConstantDocument,
} from '../../../database/schemas/constant.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SaveCategoriesDto } from './dto/save-categories.dto';

@Injectable()
export class CategoriesService {
  private readonly categories: ICategory[] = [];
  private readonly categoriesAPI: Category;

  constructor(
    private configService: ConfigService,
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
  ) {
    this.categoriesAPI = new MicrotronAPI.Category({
      token: configService.get('tokens.microtron'),
    });
  }

  private async retrieveFromAPI(force: boolean) {
    if (force || _.isEmpty(this.categories)) {
      const categories = await this.categoriesAPI.getCategories();
      this.categories.push(...categories);
    }

    return this.categories;
  }

  private async retrieveFromDB(): Promise<ConstantDocument | null> {
    const categories = await this.constantModel
      .findOne({ name: Constant.ENTITIES.CATEGORIES })
      .exec();

    if (!_.isNull(categories)) {
      return categories;
    }

    return null;
  }

  public async getByAPI(
    force: boolean,
    tree: boolean,
  ): Promise<Array<ICategory | ICategoriesTree>> {
    const categories = await this.retrieveFromAPI(force);

    if (tree) {
      return MicrotronAPI.Category.buildCategoriesTree(categories);
    }

    return categories;
  }

  public async getSaved(
    tree: boolean,
  ): Promise<Array<ICategory | ICategoriesTree>> {
    const categoriesData = await this.retrieveFromDB();
    if (categoriesData) {
      const data = JSON.parse(categoriesData.toObject().value);

      return tree ? MicrotronAPI.Category.buildCategoriesTree(data) : data;
    }

    return [];
  }

  public async save(
    categoriesData: SaveCategoriesDto,
  ): Promise<boolean> {
    const categories: ICategory[] = (categoriesData.isTree
      ? MicrotronAPI.Utils.fromTree(
          categoriesData.categories as ICategoriesTree[],
          'id',
          'parentId',
        )
      : categoriesData.categories) as unknown as ICategory[];

    const savedCategories = await this.retrieveFromDB();
    if (savedCategories) {
      savedCategories.value = JSON.stringify(categories);
      await savedCategories.save();

      return true;
    }

    const categoriesConstant = new this.constantModel({
      name: Constant.ENTITIES.CATEGORIES,
      value: JSON.stringify(categories),
    });
    await categoriesConstant.save();

    return true;
  }
}
