import * as Request from './core/request';
import * as Types from './core/types/api';
export { Types, Request };
export default class GoogleTranslateAPI {
    static Request: typeof Request;
    static Types: typeof Types;
}
