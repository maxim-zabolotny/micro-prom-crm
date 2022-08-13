import { AxiosResponse } from 'axios';
export interface ILibraryResponse<TBody> {
    response: AxiosResponse<TBody>;
    body: TBody;
}
