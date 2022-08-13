const VIEW_TYPE = {
  INCREMENT: 'increment',
  DEFAULT: 'default'
}

const CELL_NAMES = [
  'Назва_Характеристики',
  'Одиниця_виміру_Характеристики',
  'Значення_Характеристики'
]

const RANGE = 'AU1:GO1'
// const RANGE = 'A1:B1'

const CURRENT_VIEW_TYPE = VIEW_TYPE.INCREMENT;

function main() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Export Products Sheet');

  const range = sheet.getRange(RANGE)
  const values = range.getValues()[0]

  Logger.log(values)
  Logger.log(values.length)
  Logger.log(values.length / 3)

  let increment = 1;
  for (let index = 0; index < values.length; index += 3) {
    Logger.log([index, increment, [0, index]]);

    [0, 1, 2].forEach(cellIndex => {
      range.getCell(1, index + cellIndex + 1)
        .setValue(
          CURRENT_VIEW_TYPE === VIEW_TYPE.DEFAULT
            ? CELL_NAMES[cellIndex]
            : CELL_NAMES[cellIndex] + '_' + increment
        )
    })

    increment++;
  }
}






