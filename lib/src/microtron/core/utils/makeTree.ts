export function makeTree<TResult, TEntity>(nodes: TEntity[], key: keyof TEntity, id: number): TResult {
    return nodes
        .filter((node) => node[key] === id)
        .reduce(
            (tree, node) => [
                ...tree,
                {
                    ...node,
                    children: makeTree(nodes, key, node.id),
                },
            ],
            [],
        )
}

