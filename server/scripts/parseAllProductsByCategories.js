const path = require('path');
const _ = require('lodash');
const {promises: fs} = require('fs');
const {default: MicrotronAPI} = require('../lib/microtron');

const AUTH_TOKEN = '';

const SELECTED_CATEGORIES_FILE_PATH = path.join(__dirname, '../src/data/selected-categories.json');
const PRODUCTS_CACHE_FILE_PATH = path.join(__dirname, '../src/data/cache/products-cache.json');

const GROUPED_PRODUCTS_FILE_PATH = path.join(__dirname, './grouped-products.json');
const PARSED_PRODUCTS_FILE_PATH = path.join(__dirname, './parsed-products.json');

const CHUNK = 10;
const SLEEP = 1000 * 2;

const LIMIT = Infinity;

const isValidProduct = _.conforms({
  url: (url) => !_.isEmpty(url),
});

async function sleep(time) {
  console.debug(`Sleep ${time / 1000}s`, {timeMS: time});
  return new Promise(r => setTimeout(r, time));
}

function buildUnionProductUrl(url) {
  const keyValue = 'microtron.ua';
  const keyValueIndex = url.indexOf(keyValue);

  if (keyValueIndex < 0) {
    console.debug('Product url already union version:', {url});
    return url;
  }

  const unionUrl = url.slice(keyValueIndex + keyValue.length);
  console.debug('Transform Product url to union version:', {
    url,
    unionUrl,
  });

  return unionUrl;
}

async function parseAllProductsByCategories() {
  console.debug('Load saved categories');
  const savedCategories = JSON.parse(await fs.readFile(SELECTED_CATEGORIES_FILE_PATH, {encoding: 'utf-8'}));

  const categoryIds = _.map(savedCategories, 'id');
  console.debug('Count of saved categories in DB:', {
    count: categoryIds.length,
  });

  try {
    const products = _.flattenDeep(
      _.map(
        Object.entries(
          JSON.parse(await fs.readFile(PRODUCTS_CACHE_FILE_PATH, {encoding: 'utf-8'}))
        ),
        ([key, value]) => value
      )
    ).slice(0, 10);
    // const productsAPI = new MicrotronAPI.Product({
    //   token: AUTH_TOKEN,
    // });
    //
    // console.debug('Request products');
    // const products = await productsAPI.getProducts(
    //   {
    //     local: true,
    //     lang: MicrotronAPI.Types.Lang.UA,
    //     categoryIds,
    //   },
    //   true,
    // );

    const groupedProducts = _.groupBy(products, 'categoryId');
    const productCategoryIds = Object.keys(groupedProducts);

    const allCategoryIds = _.uniq([...categoryIds, ...productCategoryIds]);
    _.forEach(allCategoryIds, (categoryId) => {
      if (!productCategoryIds.includes(categoryId)) {
        groupedProducts[categoryId] = [];
      }

      if (!_.isEmpty(groupedProducts[categoryId])) {
        groupedProducts[categoryId] = _.filter(groupedProducts[categoryId], isValidProduct);
      }
    });

    console.debug('Loaded categories result:', {
      passed: categoryIds,
      loaded: productCategoryIds,
      all: allCategoryIds,
    });

    console.debug('Saving grouped products');
    await fs.writeFile(GROUPED_PRODUCTS_FILE_PATH, JSON.stringify(groupedProducts, null, 2), {encoding: 'utf-8'});

    const orderedProducts = _.chain(products)
      .filter(product => isValidProduct(product))
      .orderBy(product => product.id, ['ASC'])
      .value();

    console.debug('Loaded products result:', {
      countRaw: products.length,
      countFiltered: orderedProducts.length,
      countInvalid: products.length - orderedProducts.length
    });

    console.debug('Parse products...');
    const chunks = _.chunk(orderedProducts, CHUNK);

    const parsedProducts = [];

    try {
      let chunkIndex = 0;
      for (const chunk of chunks) {
        const chunkNumber = chunkIndex + 1;

        console.debug('Parse chunk:', {
          number: chunkNumber,
          size: chunk.length
        });

        const parsedChunkProducts = _.compact(
          _.flattenDeep(
            await Promise.all(
              chunk.map(async product => {
                const UAUrl = product.url;

                const productIdIndex = UAUrl.lastIndexOf('/p');
                const productId = UAUrl.slice(productIdIndex + 1); // with p*
                const urlWithoutProductId = UAUrl.slice(0, productIdIndex);
                const RUUrl = `${urlWithoutProductId}_ru/${productId}`;

                try {
                  const uaParse = (await MicrotronAPI.ParserV2.load(UAUrl)).parse();
                  const ruParse = (await MicrotronAPI.ParserV2.load(RUUrl)).parse();

                  return [
                    {
                      url: UAUrl,
                      parse: uaParse
                    },
                    {
                      url: RUUrl,
                      parse: ruParse
                    },
                  ];
                } catch (err) {
                  const response = err?.response;
                  if (response) {
                    switch (response.status) {
                      case 404: {
                        console.info('URL not found. Return [null, null]:', {
                          productId: product.id,
                          url: err?.config?.url,
                          response: {
                            status: response.status,
                            text: response.statusText
                          }
                        });

                        return [
                          {
                            url: UAUrl,
                            parse: null
                          },
                          {
                            url: RUUrl,
                            parse: null
                          },
                        ];
                      }
                      case 502: {
                        console.info('Request limit exceeded:', {
                          productId: product.id,
                          url: err?.config?.url,
                          response: {
                            status: response.status,
                            text: response.statusText
                          }
                        });

                        console.debug('Push product to current chunk array and sleep...', {
                          productId: product.id,
                          productUrl: product.url,
                        });
                        chunk.push(product);
                        await sleep(1000 * 30);

                        return;
                      }
                      default: {
                        throw err;
                      }
                    }
                  }

                  throw err;
                }
              })
            )
          )
        );

        parsedProducts.push(...parsedChunkProducts);

        console.debug('Chunk parsed:', {
          number: chunkNumber,
          productsUrlsCount: parsedChunkProducts.length,
          allProductsCount: orderedProducts.length,
          leftProducts: orderedProducts.length - chunkNumber * CHUNK
        });

        chunkIndex++;
        if (chunkIndex < chunks.length) {
          if (chunkNumber * CHUNK >= LIMIT) {
            console.info('Limit exceeded. Break:', {
              limit: LIMIT,
              processed: chunkNumber * CHUNK
            });
            break;
          }

          await sleep(SLEEP);
        }
      }
    } finally {
      console.debug('Parsed products result:', {
        count: parsedProducts.length
      });

      const parsedProductsObject = Object.fromEntries(
        _.map(parsedProducts, parsedProduct => [
          buildUnionProductUrl(parsedProduct.url),
          parsedProduct.parse
        ])
      );

      console.debug('Saving parsed products');
      await fs.writeFile(PARSED_PRODUCTS_FILE_PATH, JSON.stringify(parsedProductsObject, null, 2), {encoding: 'utf-8'});
    }
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

        console.error('Parsed products result:', {
          message: err.errors
        });

        const result = {};
        _.forEach(categoryIds, (categoryId) => {
          result[categoryId] = [];
        });

        const products = _.flattenDeep(Object.values(result));

        console.debug('Saving grouped products');
        await fs.writeFile(GROUPED_PRODUCTS_FILE_PATH, JSON.stringify(result, null, 2), {encoding: 'utf-8'});

        console.debug('Saving parsed products');
        await fs.writeFile(PARSED_PRODUCTS_FILE_PATH, JSON.stringify(products, null, 2), {encoding: 'utf-8'});

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