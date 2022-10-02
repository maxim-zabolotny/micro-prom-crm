export interface ISendNotification {
  to: string;
  title: string;
  photo?: string;
  jsonObject?: Record<string, unknown>;
  details?: Array<[string, string | number]>;
  buttons?: Array<[string, string]>;
}
