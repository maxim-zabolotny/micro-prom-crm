/*external modules*/
const path = require('path');
/*other*/

const LIBRARIES = {
  MICROTRON: 'microtron',
  APERTIUM: 'apertium',
};

const MAIN_DIR = path.join(__dirname, '../');
const OUTPUT_DIR = path.join(MAIN_DIR, './dist');

const EXCLUDED_DIRS = /(node_modules|test)/;

const MODE = {
  DEV: 'development',
  PROD: 'production',
};

const TARGET_ENV = {
  NODE: 'node',
  WEB: 'web',
};

const NODE_VERSION = 'node16.0';

module.exports = {
  MAIN_DIR,
  OUTPUT_DIR,
  EXCLUDED_DIRS,
  LIBRARIES,
  MODE,
  TARGET_ENV,
  NODE_VERSION,
};
