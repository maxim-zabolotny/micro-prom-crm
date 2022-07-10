import * as cheerio from 'cheerio';
import { ISettings } from './ISettings';
import { IResult, IResultBody, IResultHead } from './IResult';
export declare type TCheerioEl = cheerio.Cheerio<cheerio.Element>;
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
    parseHead(): IResultHead;
    parseBody(): IResultBody;
    parse(): IResult;
    static load(link: string): Promise<Parser>;
    static replaceMultipleSpaces(text: string): string;
    static isUsedProduct(productName: string): boolean;
    static isNewProduct(productName: string): boolean;
    static readonly SETTINGS: ISettings;
}
