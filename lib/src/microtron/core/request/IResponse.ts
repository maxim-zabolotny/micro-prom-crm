export interface IResponseRaw<IEntity> {
    timestamp: string;
    status: boolean;
    data: IEntity;
}

export interface IResponse<IEntity> {
    timestamp: Date;
    status: boolean;
    data: IEntity;
}