/*lib*/
import { Course } from './core/course';
import { Category } from './core/category';
import { Product } from './core/product';
import { Request } from './core/request';
/*types*/
import * as Types from './core/types/api';
/*utils*/
import * as Utils from './core/utils';
import { Parser } from './core/parser';
import { ParserV2 } from './core/parserV2';
/*errors*/
import { MicroError } from './core/error';
/*other*/

export default class MicrotronAPI {
  public static Course = Course;
  public static Category = Category;
  public static Product = Product;

  public static Request = Request;

  public static Utils = Utils;
  public static Types = Types;

  public static MicroError = MicroError;

  public static Parser = Parser;
  public static ParserV2 = ParserV2;
}
