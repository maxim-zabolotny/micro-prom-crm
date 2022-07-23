import { Request } from './core/request';
import { Endpoints } from './core/request/Endpoints';
import * as Types from './core/types/api';
export { Types, Request, Endpoints };
export default class ApertiumAPI {
    static Request: typeof Request;
    static Endpoints: typeof Endpoints;
    static Types: typeof Types;
}
