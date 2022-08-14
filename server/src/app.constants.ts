import * as _ from 'lodash';
import * as keywordExtractor from 'keyword-extractor';

export namespace AppConstants {
  export namespace Product {
    export const changeFields = [];
  }

  export namespace Google {
    export namespace Sheet {
      export const URL =
        'https://docs.google.com/spreadsheets/d/1SzMijwhuMnJTjNoRqiFTHPXM9y7TdgkJCqMVsuATBY0';

      export const ID = '1SzMijwhuMnJTjNoRqiFTHPXM9y7TdgkJCqMVsuATBY0';

      export const EXEC_URL =
        'https://script.google.com/macros/s/AKfycbwgq7LKfhJgfUYGDhyeco5mRLB7xduWkIOrO-nB9KSTp8ycmeNfB9wEU6acWrPw4eyZ0Q/exec';

      export enum SPEC_CELLS_VIEW_TYPE {
        Increment = 'increment',
        Default = 'default',
      }
    }
  }

  export namespace Prom {
    const returnTheSame = (v) => (_.isNil(v) ? '' : String(v));

    export namespace Sheet {
      type TFieldsMapping = Array<[string, string, (v: unknown) => string]>;
      type TFieldsMappingDefaults = Array<[string, string]>;

      export namespace Category {
        export const FieldsMapping: TFieldsMapping = [
          ['Номер_групи', 'promId', returnTheSame],
          ['Назва_групи', 'translate.name', returnTheSame],
          ['Назва_групи_укр', 'name', returnTheSame],
          ['Ідентифікатор_групи', '_id', returnTheSame],
          ['Номер_батьківської_групи', 'parentPromId', returnTheSame],
          ['Ідентифікатор_батьківської_групи', 'parent', returnTheSame],
          // ['HTML_заголовок_групи', 'translate.name', returnTheSame],
          // ['HTML_заголовок_групи_укр', 'name', returnTheSame],
          // ['HTML_ключові_слова_групи', 'translate.name', returnTheSame],
          // ['HTML_ключові_слова_групи_укр', 'name', returnTheSame],
        ];

        export const FieldsMappingDefaults: TFieldsMappingDefaults = [];
      }

      export namespace Product {
        export const START_PROPERTIES_CELL_INDEX = 46;

        export const AVAILABLE_NUMBER_OF_PROPERTIES = 50;
        export const SINGLE_PROPERTY_CELLS_SIZE = 3;

        export const NUMBER_OF_CELLS_FOR_PROPERTIES =
          AVAILABLE_NUMBER_OF_PROPERTIES * SINGLE_PROPERTY_CELLS_SIZE;

        export const FieldsMapping: TFieldsMapping = [
          ['Код_товару', 'promId', returnTheSame],
          ['Назва_позиції', 'translate.name', returnTheSame],
          ['Назва_позиції_укр', 'name', returnTheSame],
          [
            'Пошукові_запити',
            'translate.name',
            (v: string) =>
              (keywordExtractor as any)
                .extract(v, {
                  language: 'russian',
                  remove_digits: false,
                  return_changed_case: false,
                  remove_duplicates: false,
                  return_max_ngrams: false,
                  return_chained_words: false,
                })
                .reduce((acc, key, index) => {
                  if (key.length < 3) {
                    acc[index] = [];

                    const nextIndex = index + 1;
                    const nextArr = acc[nextIndex];

                    acc[nextIndex] = nextArr
                      ? nextArr.unshift(key)
                      : (acc[nextIndex] = [key]);
                  } else {
                    const currentArr = acc[index];
                    currentArr ? currentArr.push(key) : (acc[index] = [key]);
                  }

                  return acc;
                }, [])
                .map((arr) => arr.join(' '))
                .filter((key) => key.length > 2)
                .join(','),
          ],
          ['Пошукові_запити_укр', 'name', returnTheSame],
          ['Опис', 'translate.description', returnTheSame],
          ['Опис_укр', 'description', returnTheSame],
          ['Ціна', 'ourPrice', returnTheSame],
          [
            'Посилання_зображення',
            'images',
            (images: string[]) => images.slice(0, 10).join(', '),
          ],
          ['Наявність', 'available', (v: boolean) => (v ? '"+"' : '"-"')],
          ['Кількість', 'quantity', returnTheSame],
          ['Виробник', 'brand', returnTheSame],
          ['Номер_групи', 'promGroupNumber', returnTheSame],
          ['Ідентифікатор_товару', '_id', returnTheSame],
          // ['HTML_заголовок', 'translate.name', returnTheSame],
          // ['HTML_заголовок_укр', 'name', returnTheSame],
          // ['HTML_опис', 'translate.description', returnTheSame],
          // ['HTML_опис_укр', 'description', returnTheSame],
          // ['HTML_ключові_слова', 'translate.name', returnTheSame],
          // ['HTML_ключові_слова_укр', 'name', returnTheSame],
        ];

        export const FieldsMappingDefaults: TFieldsMappingDefaults = [
          ['Тип_товару', 'r'],
          ['Валюта', 'UAH'],
          ['Одиниця_виміру', 'шт'],
          ['Мінімальний_обсяг_замовлення', '1'],
          ['Ціна_від', '-'],
          ['Де_знаходиться_товар', 'Запоріжжя'], // 194007000 - Запоріжжя - Запорожье
        ];

        export enum SpecialSpecificationKeys {
          GuaranteeTerm = 'Гарантийный срок (міс)',
          State = 'Состояние',
        }
      }
    }
  }
}
