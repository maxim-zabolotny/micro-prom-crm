/*lib*/
import * as Request from './core/request';
/*types*/
import * as Types from './core/types/api';
/*utils*/
/*errors*/
/*other*/

export { Types, Request };

export default class GoogleTranslateAPI {
  public static Request = Request.Request;

  public static Types = Types;
}
