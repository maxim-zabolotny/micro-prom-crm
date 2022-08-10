import * as _ from 'lodash';

export namespace AppConstants {
  export namespace Product {
    export const changeFields = [];
  }

  export namespace Google {
    export namespace Sheet {
      export const URL =
        'https://docs.google.com/spreadsheets/d/118REcDeqq0oABCp4AuAeHPAD5otXtk4HtKrOI5cvljI';
      export const ID = '118REcDeqq0oABCp4AuAeHPAD5otXtk4HtKrOI5cvljI';
    }
  }

  export namespace Prom {
    const returnTheSame = (v) => (_.isNil(v) ? '' : String(v));

    export namespace Sheet {
      type TFieldsMapping = Array<[string, string, (v: unknown) => string]>;
      type TFieldsMappingDefaults = Array<[string, string]>;

      export namespace Category {
        export const FieldsMapping: TFieldsMapping = [
          ['Номер_группы', 'promId', returnTheSame],
          ['Название_группы', 'translate.name', returnTheSame],
          ['Название_группы_укр', 'name', returnTheSame],
          ['Идентификатор_группы', '_id', returnTheSame],
          ['Номер_родителя', 'parentPromId', returnTheSame],
          ['Идентификатор_родителя', 'parent', returnTheSame],
          // ['HTML_заголовок_группы', 'translate.name', returnTheSame],
          // ['HTML_заголовок_группы_укр', 'name', returnTheSame],
          // ['HTML_ключевые_слова_группы', 'translate.name', returnTheSame],
          // ['HTML_ключевые_слова_группы_укр', 'name', returnTheSame],
        ];

        export const FieldsMappingDefaults: TFieldsMappingDefaults = [];
      }

      export namespace Product {
        export const START_PROPERTIES_CELL_INDEX = 47;

        export const AVAILABLE_NUMBER_OF_PROPERTIES = 50;
        export const SINGLE_PROPERTY_CELLS_SIZE = 3;

        export const NUMBER_OF_CELLS_FOR_PROPERTIES =
          AVAILABLE_NUMBER_OF_PROPERTIES * SINGLE_PROPERTY_CELLS_SIZE;

        export const FieldsMapping: TFieldsMapping = [
          ['Код_товара', 'promId', returnTheSame],
          ['Название_позиции', 'translate.name', returnTheSame],
          ['Название_позиции_укр', 'name', returnTheSame],
          ['Поисковые_запросы', 'translate.name', returnTheSame],
          ['Поисковые_запросы_укр', 'name', returnTheSame],
          ['Описание', 'translate.description', returnTheSame],
          ['Описание_укр', 'description', returnTheSame],
          ['Цена', 'ourPrice', returnTheSame],
          [
            'Ссылка_изображения',
            'images',
            (images: string[]) => images.slice(0, 10).join(', '),
          ],
          ['Наличие', 'available', (v: boolean) => (v ? '"+"' : '"-"')],
          ['Количество', 'quantity', returnTheSame],
          ['Производитель', 'brand', returnTheSame],
          ['Номер_группы', 'promGroupNumber', returnTheSame],
          ['Идентификатор_товара', '_id', returnTheSame],
          // ['HTML_заголовок', 'translate.name', returnTheSame],
          // ['HTML_заголовок_укр', 'name', returnTheSame],
          // ['HTML_описание', 'translate.description', returnTheSame],
          // ['HTML_описание_укр', 'description', returnTheSame],
          // ['HTML_ключевые_слова', 'translate.name', returnTheSame],
          // ['HTML_ключевые_слова_укр', 'name', returnTheSame],
        ];

        export const FieldsMappingDefaults: TFieldsMappingDefaults = [
          ['Тип_товара', 'r'],
          ['Валюта', 'UAH'],
          ['Единица_измерения', 'шт'],
          ['Минимальный_объем_заказа', '1'],
          ['Цена от', '"-"'],
          ['Где_находится_товар', 'Запоріжжя'], // 194007000 - Запоріжжя - Запорожье
        ];
      }
    }
  }
}
