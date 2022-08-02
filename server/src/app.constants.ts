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
    export namespace Sheet {
      export const CategoryFieldsMapping = [
        ['Номер_группы', 'promId'],
        ['Название_группы', 'translate.name'],
        ['Название_группы_укр', 'name'],
        ['Идентификатор_группы', '_id'],
        ['Номер_родителя', 'parentPromId'],
        ['Идентификатор_родителя', 'parent._id'],
      ];
    }
  }
}
