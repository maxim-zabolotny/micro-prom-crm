export interface ICourseRaw {
    m: string; // Курс межбанка
    s: string; // Курс улицы
}

export interface ICourse {
    bank: number;
    street: number;
}