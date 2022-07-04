export declare function fromTree<TEntity extends object & {
    children: TEntity[];
}, TTree extends Array<TEntity>>(tree: TTree, idKey: string, parentIdKey: string): TEntity[];
