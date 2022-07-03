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

export interface IResponseErrorRaw {
    timestamp: string;
    status: false;
    errors: string;
}

export interface IResponseError {
    timestamp: Date;
    status: false;
    errors: string;
}