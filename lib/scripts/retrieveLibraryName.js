/*external modules*/
const readline = require('readline');
/*other*/

const {
  LIBRARIES,
} = require('../webpack/constants');

function askLibraryName(rl) {
  return new Promise((resolve) => {
    rl.question('> Library: ', (libraryName) => {
      const isNumber = !Number.isNaN(Number(libraryName));
      if (isNumber) {
        const index = Number(libraryName);

        // eslint-disable-next-line no-param-reassign
        libraryName = Object.values(LIBRARIES)[index];
      }

      if (!Object.values(LIBRARIES).includes(libraryName)) {
        console.log(`> The library "${libraryName}" is not exist. Try again!`);

        rl.pause();
        return resolve(null);
      }

      console.log(`> Your choose: "${libraryName}"`);

      rl.pause();
      return resolve(libraryName);
    });
  });
}

function retrieveLibraryName() {
  const libraries = Object.values(LIBRARIES).join(', ');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const introMessages = [
    `Select one of these libraries for build: [ ${libraries} ]`,
    'Hint: You can use index for choose',
    '',
  ];
  console.log(introMessages.join('\n'));

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    let libraryName = null;
    while (typeof libraryName !== 'string') {
      rl.resume();
      // eslint-disable-next-line no-await-in-loop
      libraryName = await askLibraryName(rl);
    }

    rl.close();
    resolve(libraryName);
  });
}

module.exports = retrieveLibraryName;
