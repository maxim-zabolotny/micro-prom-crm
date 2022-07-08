export declare type THEADKeys = 'OG' | 'PRODUCT' | 'BASE';
export interface IHEADKeyEntity {
    value: string;
    alias: string;
}
export interface IHEADSettingEntity {
    wildcard: string;
    attrKey: string;
    attrValue: string;
    keys: IHEADKeyEntity[];
}
export declare type TBODYKeys = 'NAME' | 'DETAILS' | 'DESCRIPTION' | 'SPECIFICATIONS';
export interface IBODYKeyEntity {
    selector: string;
}
export interface ISettings {
    HEAD: Record<THEADKeys, IHEADSettingEntity>;
    BODY: Record<TBODYKeys, IBODYKeyEntity>;
}
