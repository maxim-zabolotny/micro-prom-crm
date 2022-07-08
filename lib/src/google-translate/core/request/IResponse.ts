import { Lang } from '../types/api';

export type TTranslateResponse = [
  [
    [
      string, // source text
      string, // translated text
    ]
  ],
  null,
  Lang, // source lang
];
