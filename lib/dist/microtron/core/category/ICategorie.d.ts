export interface ICategoryRaw {
    id: string;
    parentId: string;
    name: string;
}
export interface ICategory {
    id: number;
    parentId: number;
    name: string;
}
export interface ICategoriesTree extends ICategory {
    children: ICategory[];
}
