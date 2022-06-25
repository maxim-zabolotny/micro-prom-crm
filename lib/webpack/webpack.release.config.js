/*webpack data & utils */
const { buildUsageConfig } = require('./webpack.common.config');
const { TARGET_ENV, MODE } = require('./constants');
/*other*/

if (!process.env.LIBRARY_NAME) {
  throw new Error('process.env.LIBRARY_NAME is empty!');
}

module.exports = [
  buildUsageConfig(process.env.LIBRARY_NAME, TARGET_ENV.NODE, MODE.PROD),
  buildUsageConfig(process.env.LIBRARY_NAME, TARGET_ENV.WEB, MODE.PROD),
];
