export interface IPagination {
  limit: number;
  last_id: number; // selection to orders with IDs not higher than the specified one.
}

export interface ITimestampPeriod {
  date_from: Date | string;
  date_to: Date | string;
}
