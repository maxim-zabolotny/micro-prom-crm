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
export class ReloadConstantExcludedProductsCommand {
  constructor(
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
  ) {}

  @Command({
    command: 'reload:excluded-products-constant',
    describe: 'reload excluded products from constants',
  })
  async create() {
    const excludedProducts = await Data.ExcludedProducts.read();
    const excludedProductsJSON = JSON.stringify(excludedProducts);

    const excludedProductsConstant = await this.constantModel
      .findOne({ name: ConstantEntities.EXCLUDED_PRODUCTS })
      .exec();
    if (excludedProductsConstant) {
      console.debug('RELOAD: take excluded products from DB');

      excludedProductsConstant.value = excludedProductsJSON;
      await excludedProductsConstant.save();

      console.debug(
        'RELOAD: update existed excluded products',
        excludedProductsConstant.toObject(),
      );
    } else {
      console.debug(`RELOAD: excluded products doesn't exist in DB`);

      const excludedProductsConstant = new this.constantModel({
        name: ConstantEntities.EXCLUDED_PRODUCTS,
        value: excludedProductsJSON,
      });
      await excludedProductsConstant.save();

      console.debug(
        'RELOAD: create excluded products constant',
        excludedProductsConstant.toObject(),
      );
    }
  }
}
