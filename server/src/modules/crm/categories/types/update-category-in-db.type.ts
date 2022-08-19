import { Category, CategorySync } from '@schemas/category';

export type TUpdateCategoryInDB = Partial<
  Pick<Category, 'course' | 'markup'> & {
    'sync.localAt': CategorySync['localAt'];
    'sync.loaded': CategorySync['loaded'];
    'sync.lastLoadedAt': CategorySync['lastLoadedAt'];
    'sync.tableLine': CategorySync['tableLine'];
  }
>;
