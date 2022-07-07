import { Course } from './core/course';
import { Category } from './core/category';
import { Product } from './core/product';
import { Request } from './core/request';
import * as Types from './core/types/api';
import * as Utils from './core/utils';
import { MicroError } from './core/error';
export default class MicrotronAPI {
    static Course: typeof Course;
    static Category: typeof Category;
    static Product: typeof Product;
    static Request: typeof Request;
    static Utils: typeof Utils;
    static Types: typeof Types;
    static MicroError: typeof MicroError;
}
