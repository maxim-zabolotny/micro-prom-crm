export interface IBODYKeyEntity {
  selector: string
}

export interface ISettings {
  NAME: IBODYKeyEntity;
  DESCRIPTION: IBODYKeyEntity;
  BRAND: IBODYKeyEntity;
  AVAILABILITY: IBODYKeyEntity;
  PRICE: IBODYKeyEntity;
  SPECIFICATIONS: IBODYKeyEntity & {
    tableTitle: string;
  };
}
