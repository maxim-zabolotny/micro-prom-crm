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
export class ReloadConstantCategoriesCommand {
  constructor(
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
  ) {}

  @Command({
    command: 'reload:categories-constant',
    describe: 'reload categories from constants',
  })
  async create() {
    const selectedCategories = await Data.SelectedCategories.read();
    const selectedCategoriesJSON = JSON.stringify(selectedCategories);

    const categories = await this.constantModel
      .findOne({ name: ConstantEntities.CATEGORIES })
      .exec();
    if (categories) {
      console.debug('RELOAD: take categories from DB');

      categories.value = selectedCategoriesJSON;
      await categories.save();

      console.debug('RELOAD: update exist categories', categories.toObject());
    } else {
      console.debug('RELOAD: categories not exist in DB');

      const categories = new this.constantModel({
        name: ConstantEntities.CATEGORIES,
        value: selectedCategoriesJSON,
      });
      await categories.save();

      console.debug(
        'RELOAD: create categories constant',
        categories.toObject(),
      );
    }
  }
}
