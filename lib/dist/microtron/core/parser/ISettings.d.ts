import { TObject } from '../types';
import { IResultHeadBase, IResultHeadOG, IResultHeadProduct, THeadResults } from './IResult';
export interface IHEADSettingKeyEntity<TAlias> {
    value: string;
    alias: TAlias;
}
export declare type THEADSettingsKeys<TResult extends THeadResults> = {
    [TAlias in keyof TResult]: IHEADSettingKeyEntity<TAlias>;
};
export interface IHEADSettingEntity<TResult extends THeadResults> {
    wildcard: string;
    attrKey: string;
    attrValue: string;
    keys: TObject.TValues<THEADSettingsKeys<TResult>>;
}
export interface IHeadSettings {
    OG: IHEADSettingEntity<IResultHeadOG>;
    PRODUCT: IHEADSettingEntity<IResultHeadProduct>;
    BASE: IHEADSettingEntity<IResultHeadBase>;
}
export declare type TBODYKeys = 'NAME' | 'DETAILS' | 'DESCRIPTION' | 'SPECIFICATIONS';
export interface IBODYKeyEntity {
    selector: string;
}
export declare type TBodySettings = Record<TBODYKeys, IBODYKeyEntity>;
export interface ISettings {
    HEAD: IHeadSettings;
    BODY: TBodySettings;
}
