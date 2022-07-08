import { Lang } from '../types/api';
export interface IResult {
    sourceLang: Lang;
    targetLang: Lang;
    sourceText: string;
    translatedText: string;
}
