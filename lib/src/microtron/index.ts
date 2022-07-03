/*lib*/
import { Course } from './core/course';
import { Category } from './core/category';
import { Product } from './core/product';
import { Request } from './core/request';
/*types*/
import * as Types from './core/types/api';
/*utils*/
import * as Utils from './core/utils';
/*other*/

export default class MicrotronAPI {
  public static Course = Course;
  public static Category = Category;
  public static Product = Product;

  public static Request = Request;

  public static Utils = Utils;
  public static Types = Types;
}
