// HEAD
export type THEADKeys = 'OG' | 'PRODUCT' | 'BASE'
export interface IHEADKeyEntity {
  value: string,
  alias: string
}
export interface IHEADSettingEntity {
  wildcard: string,
  attrKey: string;
  attrValue: string;
  keys: IHEADKeyEntity[]
}

// BODY
export type TBODYKeys = 'NAME' | 'DETAILS' | 'DESCRIPTION' | 'SPECIFICATIONS'
export interface IBODYKeyEntity {
  selector: string
}

// SETTINGS
export interface ISettings {
  HEAD: Record<THEADKeys, IHEADSettingEntity>,
  BODY: Record<TBODYKeys, IBODYKeyEntity>
}
