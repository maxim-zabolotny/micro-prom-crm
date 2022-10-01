import { UserRole } from "../components/CurrentUser";

const USERS_URL = "/crm/users";
const CATEGORIES_URL = "/crm/categories";
const PRODUCTS_URL = "/crm/products";
const PRODUCT_BOOKINGS_URL = "/crm/product-bookings";
const PRODUCT_SALES_URL = "/crm/product-sales";
const CLIENTS_URL = "/prom/clients";

export const API_URL = {
  USERS: {
    BASE: USERS_URL,
    $PERMISSIONS: {
      [USERS_URL]: [...Object.values(UserRole)],
    },
  },
  CATEGORIES: {
    BASE: CATEGORIES_URL,
    $PERMISSIONS: {
      [CATEGORIES_URL]: [],
    },
  },
  PRODUCTS: {
    BASE: PRODUCTS_URL,
    ALL: `${PRODUCTS_URL}/all`,
    SEARCH: `${PRODUCTS_URL}/search`,
    $PERMISSIONS: {
      [PRODUCTS_URL]: [...Object.values(UserRole)],
      [`${PRODUCTS_URL}/all`]: [...Object.values(UserRole)],
      [`${PRODUCTS_URL}/search`]: [...Object.values(UserRole)],
    },
  },
  PRODUCT_BOOKINGS: {
    BASE: PRODUCT_BOOKINGS_URL,
    SEARCH: `${PRODUCT_BOOKINGS_URL}/search`,
    CREATE: `${PRODUCT_BOOKINGS_URL}/create`,
    APPROVE: `${PRODUCT_BOOKINGS_URL}/approve`,
    DISAPPROVE: `${PRODUCT_BOOKINGS_URL}/disapprove`,
    $PERMISSIONS: {
      [PRODUCT_BOOKINGS_URL]: [...Object.values(UserRole)],
      [`${PRODUCT_BOOKINGS_URL}/search`]: [...Object.values(UserRole)],
      [`${PRODUCT_BOOKINGS_URL}/create`]: [UserRole.Sales, UserRole.Admin],
      [`${PRODUCT_BOOKINGS_URL}/approve`]: [UserRole.Provider, UserRole.Admin],
      [`${PRODUCT_BOOKINGS_URL}/disapprove`]: [
        UserRole.Provider,
        UserRole.Admin,
      ],
    },
  },
  PRODUCT_SALES: {
    BASE: PRODUCT_SALES_URL,
    SEARCH: `${PRODUCT_SALES_URL}/search`,
    SET_DESCRIPTION: `${PRODUCT_SALES_URL}/set-description`,
    SET_ORDER: `${PRODUCT_SALES_URL}/set-order`,
    SET_CLIENT: `${PRODUCT_SALES_URL}/set-client`,
    DELIVERY: `${PRODUCT_SALES_URL}/delivery`,
    SALE: `${PRODUCT_SALES_URL}/sale`,
    CANCEL: `${PRODUCT_SALES_URL}/cancel`,
    $PERMISSIONS: {
      [PRODUCT_SALES_URL]: [...Object.values(UserRole)],
      [`${PRODUCT_SALES_URL}/search`]: [...Object.values(UserRole)],
      [`${PRODUCT_SALES_URL}/set-description`]: [
        UserRole.Sales,
        UserRole.Admin,
      ],
      [`${PRODUCT_SALES_URL}/set-order`]: [UserRole.Sales, UserRole.Admin],
      [`${PRODUCT_SALES_URL}/set-client`]: [UserRole.Sales, UserRole.Admin],
      [`${PRODUCT_SALES_URL}/delivery`]: [UserRole.Sales, UserRole.Admin],
      [`${PRODUCT_SALES_URL}/sale`]: [UserRole.Sales, UserRole.Admin],
      [`${PRODUCT_SALES_URL}/cancel`]: [UserRole.Sales, UserRole.Admin],
    },
  },
  CLIENTS: {
    BASE: CLIENTS_URL,
    SEARCH: `${CLIENTS_URL}/search`,
    $PERMISSIONS: {
      [CLIENTS_URL]: [...Object.values(UserRole)],
      [`${CLIENTS_URL}/search`]: [...Object.values(UserRole)],
    },
  },
  getPermissions(path) {
    let permissions;
    switch (true) {
      case path.startsWith(USERS_URL): {
        permissions = this.USERS.$PERMISSIONS;
        break;
      }
      case path.startsWith(CATEGORIES_URL): {
        permissions = this.CATEGORIES.$PERMISSIONS;
        break;
      }
      case path.startsWith(PRODUCTS_URL): {
        permissions = this.PRODUCTS.$PERMISSIONS;
        break;
      }
      case path.startsWith(PRODUCT_BOOKINGS_URL): {
        permissions = this.PRODUCT_BOOKINGS.$PERMISSIONS;
        break;
      }
      case path.startsWith(PRODUCT_SALES_URL): {
        permissions = this.PRODUCT_SALES.$PERMISSIONS;
        break;
      }
      case path.startsWith(CLIENTS_URL): {
        permissions = this.CLIENTS.$PERMISSIONS;
        break;
      }
      default: {
        throw new Error(`Invalid path: "${path}"`);
      }
    }

    return permissions[path];
  },
};
