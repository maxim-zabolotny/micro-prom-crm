export declare class Parser {
    readonly page: string;
    constructor(page: string);
    static load(url: string): Promise<Parser>;
}
