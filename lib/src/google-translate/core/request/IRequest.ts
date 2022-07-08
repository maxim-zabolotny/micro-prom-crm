import { Lang } from '../types/api';

export interface ITranslateRequestOptions {
  text: string,
  from: Lang;
  to: Lang;
}

export interface ITranslateRequestRawOptions {
  q: string; // text
  sl: Lang, // from
  tl: Lang; // to
}
