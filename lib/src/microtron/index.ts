/*lib*/
import * as Course from './core/course';
import * as Category from './core/category';
import * as Product from './core/product';
import { Request } from './core/request';
/*types*/
import * as Types from './core/types/api';
/*utils*/
import * as Utils from './core/utils';
import * as Parser from './core/parser';
import * as ParserV2 from './core/parserV2';
/*errors*/
import { MicroError } from './core/error';
/*other*/

export {
  Course,
  Category,
  Product,
  Types,
  MicroError,
  Parser,
  ParserV2,
};

export default class MicrotronAPI {
  public static Course = Course.Course;
  public static Category = Category.Category;
  public static Product = Product.Product;

  public static Request = Request;

  public static Utils = Utils;
  public static Types = Types;

  public static MicroError = MicroError;

  public static Parser = Parser.Parser;
  public static ParserV2 = ParserV2.ParserV2;
}
