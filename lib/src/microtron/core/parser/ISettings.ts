import { TObject } from '../types';
import {
  IResultHeadBase, IResultHeadOG, IResultHeadProduct, THeadResults,
} from './IResult';

// HEAD
export interface IHEADSettingKeyEntity<TAlias> {
  value: string,
  alias: TAlias
}

export type THEADSettingsKeys<TResult extends THeadResults> = {
  [TAlias in keyof TResult]: IHEADSettingKeyEntity<TAlias>
}

export interface IHEADSettingEntity<TResult extends THeadResults> {
  wildcard: string,
  attrKey: string;
  attrValue: string;
  keys: TObject.TValues<THEADSettingsKeys<TResult>>
}

export interface IHeadSettings {
  OG: IHEADSettingEntity<IResultHeadOG>,
  PRODUCT: IHEADSettingEntity<IResultHeadProduct>,
  BASE: IHEADSettingEntity<IResultHeadBase>
}

// BODY
export type TBODYKeys = 'NAME' | 'DETAILS' | 'DESCRIPTION' | 'SPECIFICATIONS'

export interface IBODYKeyEntity {
  selector: string
}

export type TBodySettings = Record<TBODYKeys, IBODYKeyEntity>

// SETTINGS
export interface ISettings {
  HEAD: IHeadSettings,
  BODY: TBodySettings
}
