const path = require('path');
const _ = require('lodash');
const {promises: fs} = require('fs');
const {default: MicrotronAPI} = require('../lib/microtron');

const AUTH_TOKEN = '';

const SELECTED_CATEGORIES_FILE_PATH = path.join(__dirname, '../src/data/selected-categories.json');
const RESULT_FILE_PATH = path.join(__dirname, './result.json');

async function parseAllProductsByCategories() {
  console.debug('Load saved categories');
  const savedCategories = JSON.parse(await fs.readFile(SELECTED_CATEGORIES_FILE_PATH, {encoding: 'utf-8'}));

  const categoryIds = _.map(savedCategories, 'id');
  console.debug('Count of saved categories in DB:', {
    count: categoryIds.length,
  });

  try {
    const productsAPI = new MicrotronAPI.Product({
      token: AUTH_TOKEN,
    });

    console.debug('Request products');
    const products = await productsAPI.getProducts(
      {
        local: true,
        lang: MicrotronAPI.Types.Lang.UA,
        categoryIds,
      },
      true,
    );

    const groupedProducts = _.groupBy(products, 'categoryId');
    const productCategoryIds = Object.keys(groupedProducts);

    const allCategoryIds = _.uniq([...categoryIds, ...productCategoryIds]);
    _.forEach(allCategoryIds, (categoryId) => {
      if (!productCategoryIds.includes(categoryId)) {
        groupedProducts[categoryId] = [];
      }
    });

    console.debug('Loaded categories result:', {
      passed: categoryIds,
      loaded: productCategoryIds,
      all: allCategoryIds,
    });

    console.debug('Saving products');
    await fs.writeFile(RESULT_FILE_PATH, JSON.stringify(groupedProducts, null, 2), {encoding: 'utf-8'});
  } catch (err) {
    if (err instanceof MicrotronAPI.MicroError) {
      if (err.errors === 'Нет товаров для вывода') {
        console.error(
          err.errors,
          _.pick(err, [
            'url',
            'path',
            'errors',
            'response.config.data',
            'response.config.url',
          ]),
        );

        const result = {};
        _.forEach(categoryIds, (categoryId) => {
          result[categoryId] = [];
        });

        console.debug('Saving products');
        await fs.writeFile(RESULT_FILE_PATH, JSON.stringify(result, null, 2), {encoding: 'utf-8'});

        return;
      }
    }

    throw err;
  }
}

parseAllProductsByCategories()
  .catch(err => {
    console.error(err);
  });