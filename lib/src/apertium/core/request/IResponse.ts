export interface IDetectLanguageResponse {
  [key: string]: number;
}

export interface ITranslateResponse {
  responseData: {
    translatedText: string;
  },
  responseDetails: unknown | null;
  responseStatus: number;
}
