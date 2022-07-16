import * as cheerio from 'cheerio';
import { ProductAvailabilityV2 } from '../types/api';
import { IResult, IResultBody } from './IResult';
import { ISettings } from './ISettings';
export declare type TCheerioEl = cheerio.Cheerio<cheerio.Element>;
export declare class ParserV2 {
    readonly htmlPage: string;
    readonly $root: cheerio.CheerioAPI;
    readonly link: string;
    constructor(htmlPage: string, link: string);
    private parseElementText;
    private parseProductSpecifications;
    private getProductName;
    private getProductDescription;
    private getProductBrand;
    private getProductAvailability;
    private getProductCost;
    private getProductSpecifications;
    parseBody(): IResultBody;
    parse(): IResult;
    static load(link: string): Promise<ParserV2>;
    static replaceMultipleSpaces(text: string): string;
    static isUsedProduct(productName: string): boolean;
    static isNewProduct(productName: string): boolean;
    static isAvailable(productAvailability: ProductAvailabilityV2): boolean;
    static isNotAvailable(productAvailability: ProductAvailabilityV2): boolean;
    static readonly SETTINGS: ISettings;
}
