import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Constant,
  ConstantDocument,
  ConstantEntities,
} from '@schemas/constant';
import { Model } from 'mongoose';
import { Data } from '../../data';

@Injectable()
export class ConstantSeed {
  constructor(
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
  ) {}

  @Command({ command: 'create:constants', describe: 'create constants' })
  async create() {
    await this.loadCategories();
    await this.loadExcludedProducts();
  }

  async loadCategories() {
    const selectedCategories = await Data.SelectedCategories.read();

    const categoriesConstant = new this.constantModel({
      name: ConstantEntities.CATEGORIES,
      value: JSON.stringify(selectedCategories),
    });
    await categoriesConstant.save();

    console.log(
      'SAVED: categories constant => ',
      categoriesConstant.toObject(),
    );
  }

  async loadExcludedProducts() {
    const excludedProducts = await Data.ExcludedProducts.read();

    const excludedProductsConstant = new this.constantModel({
      name: ConstantEntities.EXCLUDED_PRODUCTS,
      value: JSON.stringify(excludedProducts),
    });
    await excludedProductsConstant.save();

    console.log(
      'SAVED: excluded products constant => ',
      excludedProductsConstant.toObject(),
    );
  }
}
