import * as _ from 'lodash';
import {Injectable} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import MicrotronAPI from "@lib/microtron";
import { Category } from "@lib/microtron/core/category";
import { ICategory, ICategoriesTree } from "@lib/microtron/core/category/ICategorie";

@Injectable()
export class MicrotronService {
  private readonly categories: ICategory[] = [];
  private readonly categoriesAPI: Category;

  constructor(private configService: ConfigService) {
    this.categoriesAPI = new MicrotronAPI.Category({
      token: configService.get('tokens.microtron')
    })
  }

  private async retrieveCategories(force: boolean) {
    if(force || _.isEmpty(this.categories)) {
      const categories = await this.categoriesAPI.getCategories(MicrotronAPI.Types.Lang.UA)
      this.categories.push(...categories);
    }

    return this.categories;
  }

  public async getCategories(force: boolean): Promise<ICategory[]> {
    return this.retrieveCategories(force);
  }

  public async getCategoriesTree(force: boolean): Promise<ICategoriesTree[]> {
    const categories = await this.retrieveCategories(force);
    return MicrotronAPI.Category.buildCategoriesTree(categories);
  }


}
