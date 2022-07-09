import * as path from 'path';
import { promises as fs } from 'fs';
import { ICategory } from '@lib/microtron/core/category/ICategorie';

export namespace Data {
  export namespace SelectedCategories {
    export const fileName = 'selected-categories.json';
    export const filePath = path.join(__dirname, fileName);

    export async function read(): Promise<ICategory[]> {
      const data = await fs.readFile(filePath, { encoding: 'utf-8' });
      return JSON.parse(data);
    }

    export async function write(categories: ICategory[]) {
      const data = JSON.stringify(categories, null, 2);
      await fs.writeFile(filePath, data, { encoding: 'utf-8' });
    }
  }
}