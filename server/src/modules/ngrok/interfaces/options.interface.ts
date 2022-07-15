export interface IPublicOptions {
  port: number;
  proto?: 'http' | 'https';
  authToken?: string;
  hostHeader?: string;
  logLevel?: string;
}

export interface IPrivateOptions {
  log: string;
  logFormat: string;
}

export interface IOptions extends IPublicOptions, IPrivateOptions {}
