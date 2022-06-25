/* eslint-disable import/no-extraneous-dependencies */
/*external modules*/
const path = require('path');
const childProcess = require('child_process');
const commandLineArgs = require('command-line-args');
/*build utils*/
const retrieveLibraryName = require('./retrieveLibraryName');
const preparePackage = require('./preparePackage');
/*other*/

const MAIN_DIR = path.join(__dirname, '../');

async function main() {
  // OPTIONS
  const options = commandLineArgs(
    [
      {
        name: 'exec', alias: 'e', type: String,
      },
    ],
  );

  // LIBRARY NAME
  const libraryName = await retrieveLibraryName();

  // EXEC
  await new Promise((resolve, reject) => {
    const webpackProcess = childProcess.spawn(
      `LIBRARY_NAME=${libraryName} ${options.exec}`,
      {
        cwd: MAIN_DIR,
        shell: true,
      },
    );

    webpackProcess.on('error', (error) => reject(error));
    webpackProcess.on('close', (code, signal) => resolve(code, signal));

    webpackProcess.stdout.pipe(process.stdout);
  });

  // PREPARE PACKAGE
  preparePackage(libraryName);
}

main()
  .catch((err) => console.log(err));
