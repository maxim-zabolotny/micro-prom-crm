/*external modules*/
const fs = require('fs');
const path = require('path');
/*other*/

const ROOT_DIR = path.join(__dirname, '../');
const DIST_PATH = path.join(ROOT_DIR, './dist');

function readJSONFile(filePath) {
  const source = fs.readFileSync(filePath).toString('utf-8');
  return JSON.parse(source);
}

function changePackageData(packageData, libraryName) {
  // DELETES
  delete packageData.scripts;
  delete packageData.devDependencies;

  // ADD FIELDS
  packageData.name = libraryName;

  packageData.main = `${libraryName}.node.js`;
  packageData.browser = `${libraryName}.web.js`;

  packageData.files = ['*'];

  // TS FIELDS
  const declarationsEntrypointPath = './index.d.ts';

  packageData.types = declarationsEntrypointPath;
  packageData.typescript = {
    definition: declarationsEntrypointPath,
  };
}

function preparePackage(libraryName) {
  const libraryPath = path.join(DIST_PATH, libraryName);

  // package.json
  const packageData = readJSONFile(path.join(ROOT_DIR, './package.json'));
  changePackageData(packageData, libraryName);

  // common files
  fs.writeFileSync(
    path.join(libraryPath, './package.json'),
    Buffer
      .from(JSON.stringify(packageData, null, 2), 'utf-8')
      .toString(),
  );

  fs.copyFileSync(path.join(ROOT_DIR, '.gitignore'), path.join(libraryPath, '.gitignore'));
}

module.exports = preparePackage;
