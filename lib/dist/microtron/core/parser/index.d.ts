import * as cheerio from 'cheerio';
import { ISettings } from './ISettings';
export declare class Parser {
    readonly htmlPage: string;
    readonly $root: cheerio.CheerioAPI;
    constructor(htmlPage: string);
    private parseMetaTags;
    private parseElementText;
    private parseProductDetails;
    private parseProductSpecifications;
    private getHeadOG;
    private getHeadProduct;
    private getHeadBase;
    private getProductName;
    private getProductDescription;
    private getProductDetails;
    private getProductSpecifications;
    getTitle(): string;
    parseHead(): {
        og: Record<string, unknown>;
        product: Record<string, unknown>;
        base: Record<string, unknown>;
    };
    parseBody(): {
        name: string;
        description: string;
        details: Record<string, string>;
        specifications: Record<string, string>;
    };
    parse(): {
        title: string;
        head: {
            og: Record<string, unknown>;
            product: Record<string, unknown>;
            base: Record<string, unknown>;
        };
        body: {
            name: string;
            description: string;
            details: Record<string, string>;
            specifications: Record<string, string>;
        };
    };
    static load(link: string): Promise<Parser>;
    static replaceMultipleSpaces(text: string): string;
    static readonly SETTINGS: ISettings;
}
