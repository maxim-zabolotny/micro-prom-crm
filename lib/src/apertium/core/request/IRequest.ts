export interface IDetectLanguageRequest {
  q: string; // text
}

export interface ITranslateRequest extends IDetectLanguageRequest {
  langpair: string; // example: rus|urk
  markUnknown: 'yes' | 'no';
  prefs: string;
}

export type TRequestData = IDetectLanguageRequest | ITranslateRequest;
