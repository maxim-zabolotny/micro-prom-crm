/*external modules*/
import _ from 'lodash';
/*other*/

export function makeTree<
  TEntity extends object,
  TKey extends keyof TEntity,
  TTree extends Array<Omit<TEntity, TKey> & { children: TEntity[] }>,
>(
  nodes: TEntity[],
  key: TKey,
  id: number,
): TTree {
  return _.chain(nodes)
    .filter(((node) => (node[key] as unknown as number) === id))
    .reduce<any>(
      (tree, node) => [
        ...tree,
        {
          ..._.omit(node, key),
          children: makeTree(nodes, key, _.get(node, 'id')),
        },
      ],
      [],
    )
    .value();
}
