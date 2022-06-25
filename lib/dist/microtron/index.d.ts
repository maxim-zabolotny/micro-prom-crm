import { Course } from './core/course';
import { Category } from './core/category';
import { Product } from './core/product';
import { Request } from './core/request';
export default class MicrotronAPI {
    static Course: typeof Course;
    static Category: typeof Category;
    static Product: typeof Product;
    static Request: typeof Request;
}
