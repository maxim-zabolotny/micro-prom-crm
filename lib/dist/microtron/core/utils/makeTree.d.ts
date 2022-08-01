export declare function makeTree<TEntity extends object, TKey extends keyof TEntity, TTree extends Array<Omit<TEntity, TKey> & {
    children: TEntity[];
}>>(nodes: TEntity[], key: TKey, id: number | string): TTree;
