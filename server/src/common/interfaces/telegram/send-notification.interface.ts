export interface ISendNotification {
  to: string;
  title: string;
  details?: Array<[string, string | number]>;
  button?: [string, string];
}
