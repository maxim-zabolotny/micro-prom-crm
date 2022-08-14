// CONSTANTS
const VIEW_TYPE = {
  INCREMENT: 'increment',
  DEFAULT: 'default'
};

const CELL_NAMES = [
  'Назва_Характеристики',
  'Одиниця_виміру_Характеристики',
  'Значення_Характеристики'
];

const RANGE = 'AU1:GN1';

// REQUEST
function doGet(request) {
  const viewType = request.parameter.q;

  if (!Object.values(VIEW_TYPE)
    .includes(viewType)) {
    const response = {
      result: 'error',
      message: 'Invalid view type',
      viewType
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    renameSpecificationCells(viewType);

    const response = {
      result: 'OK',
      viewType
    };
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        result: 'error',
        error: e
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// UTILS
function renameSpecificationCells(CURRENT_VIEW_TYPE) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Export Products Sheet');

  const range = sheet.getRange(RANGE);
  const values = range.getValues()[0];

  Logger.log(values);
  Logger.log(values.length);
  Logger.log(values.length / 3);

  let increment = 1;
  for (let index = 0; index < values.length; index += 3) {
    Logger.log([index, increment, [0, index]]);

    [0, 1, 2].forEach(cellIndex => {
      range.getCell(1, index + cellIndex + 1)
        .setValue(
          CURRENT_VIEW_TYPE === VIEW_TYPE.DEFAULT
            ? CELL_NAMES[cellIndex]
            : CELL_NAMES[cellIndex] + '_' + increment
        );
    });

    increment++;
  }
}

function renameSpecificationCellsToDefault() {
  renameSpecificationCells(VIEW_TYPE.DEFAULT);
}

function renameSpecificationCellsToIncrement() {
  renameSpecificationCells(VIEW_TYPE.INCREMENT);
}
