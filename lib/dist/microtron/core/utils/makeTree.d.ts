export declare function makeTree<TEntity extends object, TTree extends Array<TEntity & {
    children: TEntity[];
}>>(nodes: TEntity[], key: keyof TEntity, id: number): TTree;
