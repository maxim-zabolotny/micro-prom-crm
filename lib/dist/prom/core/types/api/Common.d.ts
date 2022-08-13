export interface IPagination {
    limit: number;
    last_id: number;
}
export interface ITimestampPeriod {
    date_from: Date | string;
    date_to: Date | string;
}
