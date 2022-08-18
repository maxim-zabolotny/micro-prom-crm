import * as path from 'path';
import { promises as fs } from 'fs';
import { ICategory } from '@lib/microtron/core/category/ICategorie';
import { IUserSeed } from '@common/interfaces/user';
import { ICategoryInConstant } from '@common/interfaces/category';

export namespace Data {
  export namespace SelectedCategories {
    export const fileName = 'selected-categories.json';
    export const filePathDist = path.join(__dirname, fileName);
    export const filePathSRC = filePathDist.replace('dist', 'src');

    export async function read(): Promise<ICategoryInConstant[]> {
      const data = await fs.readFile(filePathSRC, { encoding: 'utf-8' });
      return JSON.parse(data);
    }

    export async function write(categories: ICategoryInConstant[]) {
      const data = JSON.stringify(categories, null, 2);
      await fs.writeFile(filePathSRC, data, { encoding: 'utf-8' });
    }
  }

  export namespace SelectedRUCategories {
    export const fileName = 'selected-ru-categories.json';
    export const filePathDist = path.join(__dirname, fileName);
    export const filePathSRC = filePathDist.replace('dist', 'src');

    export async function read(): Promise<ICategory[]> {
      const data = await fs.readFile(filePathSRC, { encoding: 'utf-8' });
      return JSON.parse(data);
    }

    export async function write(categories: ICategory[]) {
      const data = JSON.stringify(categories, null, 2);
      await fs.writeFile(filePathSRC, data, { encoding: 'utf-8' });
    }
  }

  export namespace Users {
    export const fileName = 'users.json';
    export const filePathDist = path.join(__dirname, fileName);
    export const filePathSRC = filePathDist.replace('dist', 'src');

    export async function read(): Promise<IUserSeed[]> {
      const data = await fs.readFile(filePathSRC, { encoding: 'utf-8' });
      return JSON.parse(data);
    }
  }
}
