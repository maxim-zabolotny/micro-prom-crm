import { Product, ProductSync } from '@schemas/product';
import { Category } from '@schemas/category';

export type TUpdateProductInDB = Partial<
  Pick<Product, 'originalPrice' | 'originalPriceCurrency' | 'quantity'> & {
    'sync.localAt': ProductSync['localAt'];
    'sync.prom': ProductSync['prom'];
    'sync.lastPromAt': ProductSync['lastPromAt'];
    'sync.loaded': ProductSync['loaded'];
    'sync.lastLoadedAt': ProductSync['lastLoadedAt'];
    'sync.tableLine': ProductSync['tableLine'];
  } & {
    category: Pick<Category, 'course' | 'markup'>;
  }
>;
