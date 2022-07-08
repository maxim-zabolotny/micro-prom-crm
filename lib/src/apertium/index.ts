/*lib*/
import { Request } from './core/request';
import { Endpoints } from './core/request/Endpoints';
/*types*/
import * as Types from './core/types/api';
/*utils*/
/*errors*/
/*other*/

export default class ApertiumAPI {
  public static Request = Request;
  public static Endpoints = Endpoints;

  public static Types = Types;
}
