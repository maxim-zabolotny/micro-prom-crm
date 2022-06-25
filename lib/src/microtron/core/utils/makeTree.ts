/*external modules*/
import _ from 'lodash';
/*other*/

export function makeTree<
  TEntity extends object,
  TTree extends Array<TEntity & { children: TEntity[] }>,
>(
  nodes: TEntity[],
  key: keyof TEntity,
  id: number,
): TTree {
  return _.chain(nodes)
    .filter(((node) => (node[key] as unknown as number) === id))
    .reduce<any>(
      (tree, node) => [
        ...tree,
        {
          ...node,
          children: makeTree(nodes, key, _.get(node, 'id')),
        },
      ],
      [],
    )
    .value();
}
