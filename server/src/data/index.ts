import * as path from 'path';
import * as _ from 'lodash';
import { promises as fs } from 'fs';
import { ICategory } from '@lib/microtron/core/category/ICategorie';
import { IUserSeed } from '@common/interfaces/user';
import { ICategoryInConstant } from '@common/interfaces/category';
import { IExcludedProductsConstant } from '@common/interfaces/constant';

export namespace Data {
  namespace Builder {
    export function buildBaseReadWrite<TInput, TOutput>(fileName: string) {
      const filePathDist = path.join(__dirname, fileName);
      const filePathSRC = filePathDist.replace('dist', 'src');

      return {
        fileName,
        filePathDist,
        filePathSRC,
        async read(): Promise<TOutput> {
          const outputData = await fs.readFile(filePathSRC, {
            encoding: 'utf-8',
          });
          return JSON.parse(outputData);
        },
        async write(inputData: TInput) {
          const data = JSON.stringify(inputData, null, 2);
          await fs.writeFile(filePathSRC, data, { encoding: 'utf-8' });
        },
      };
    }
  }

  export const SelectedCategories = Builder.buildBaseReadWrite<
    ICategoryInConstant[],
    ICategoryInConstant[]
  >('selected-categories.json');

  export const SelectedRUCategories = Builder.buildBaseReadWrite<
    ICategory[],
    ICategory[]
  >('selected-ru-categories.json');

  export const ExcludedProducts = Builder.buildBaseReadWrite<
    IExcludedProductsConstant,
    IExcludedProductsConstant
  >('excluded-products.json');

  export const Users = Builder.buildBaseReadWrite<never, IUserSeed[]>(
    'users.json',
  );

  export namespace Logs {
    export const fileName = 'logs.txt';
    export const filePathDist = path.join(__dirname, fileName);
    export const filePathSRC = filePathDist.replace('dist', 'src');

    export async function read(): Promise<Record<string, unknown>[]> {
      const text = await fs.readFile(filePathSRC, { encoding: 'utf-8' });
      const data = _.isEmpty(text)
        ? '{}\n'
        : text.split('\n').slice(0, -1).join(',');

      return JSON.parse(`[${data}]`);
    }

    export async function push(log: Record<string, unknown>) {
      const data = JSON.stringify(log, null);
      await fs.appendFile(filePathSRC, `${data}\n`, { encoding: 'utf-8' });
    }
  }
}
