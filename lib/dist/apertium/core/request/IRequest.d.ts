export interface IDetectLanguageRequest {
    q: string;
}
export interface ITranslateRequest extends IDetectLanguageRequest {
    langpair: string;
    markUnknown: 'yes' | 'no';
    prefs: string;
}
export declare type TRequestData = IDetectLanguageRequest | ITranslateRequest;
