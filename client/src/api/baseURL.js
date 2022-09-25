import { UserRole } from "../components/CurrentUser";

const USERS_URL = "/crm/users";
const CATEGORIES_URL = "/crm/categories";
const PRODUCTS_URL = "/crm/products";
const PRODUCT_BOOKINGS_URL = "/crm/product-bookings";
const PRODUCT_SALES_URL = "/crm/product-sales";

export const API_URL = {
  USERS: {
    BASE: USERS_URL,
    $PERMISSIONS: {
      [USERS_URL]: [Object.values(UserRole)],
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
      [PRODUCTS_URL]: [Object.values(UserRole)],
      [`${PRODUCTS_URL}/all`]: [Object.values(UserRole)],
      [`${PRODUCTS_URL}/search`]: [Object.values(UserRole)],
    },
  },
  PRODUCT_BOOKINGS: {
    BASE: PRODUCT_BOOKINGS_URL,
    SEARCH: `${PRODUCT_BOOKINGS_URL}/search`,
    CREATE: `${PRODUCT_BOOKINGS_URL}/create`,
    APPROVE: `${PRODUCT_BOOKINGS_URL}/approve`,
    DISAPPROVE: `${PRODUCT_BOOKINGS_URL}/disapprove`,
    $PERMISSIONS: {
      [PRODUCT_BOOKINGS_URL]: [Object.values(UserRole)],
      [`${PRODUCT_BOOKINGS_URL}/search`]: [Object.values(UserRole)],
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
  },
};
