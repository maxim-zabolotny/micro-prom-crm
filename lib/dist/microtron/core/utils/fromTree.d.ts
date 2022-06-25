export declare function fromTree<TEntity extends object & {
    children: TEntity[];
}, TTree extends Array<TEntity>>(tree: TTree): TEntity[];
