const USERS_URL = "/crm/users";
const CATEGORIES_URL = "/crm/categories";
const PRODUCTS_URL = "/crm/products";
const PRODUCT_BOOKINGS_URL = "/crm/product-bookings";
const PRODUCT_SALES_URL = "/crm/product-sales";

export const API_URL = {
  USERS: {
    BASE: USERS_URL,
    ALL: `${USERS_URL}/all`,
  },
  CATEGORIES: {
    BASE: CATEGORIES_URL,
  },
  PRODUCTS: {
    BASE: PRODUCTS_URL,
    ALL: `${PRODUCTS_URL}/all`,
    SEARCH: `${PRODUCTS_URL}/search`,
  },
  PRODUCT_BOOKINGS: {
    BASE: PRODUCT_BOOKINGS_URL,
    SEARCH: `${PRODUCT_BOOKINGS_URL}/search`,
    CREATE: `${PRODUCT_BOOKINGS_URL}/create`,
  },
  PRODUCT_SALES: {
    BASE: PRODUCT_SALES_URL,
  },
  getUsersURL(baseUrl) {
    return `${baseUrl}${this.USERS.BASE}`;
  },
  getCategoriesURL(baseUrl) {
    return `${baseUrl}${this.CATEGORIES.BASE}`;
  },
  getProductsURL(baseUrl) {
    return `${baseUrl}${this.PRODUCTS.BASE}`;
  },
  getProductBookingsURL(baseUrl) {
    return `${baseUrl}${this.PRODUCT_BOOKINGS.BASE}`;
  },
  getProductSalesURL(baseUrl) {
    return `${baseUrl}${this.PRODUCT_SALES.BASE}`;
  },
};
