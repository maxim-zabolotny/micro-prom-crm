/*external modules*/
import _ from 'lodash';
/*other*/

export function fromTree<
  TEntity extends object & { children: TEntity[] },
  TTree extends Array<TEntity>,
>(tree: TTree): TEntity[] {
  const nodes: TEntity[] = [];

  tree.forEach(
    (node: TEntity) => {
      const localNodes: TEntity[] = [_.omit(node, 'children') as TEntity];
      if (node.children.length > 0) {
        localNodes.push(...fromTree(node.children) as TEntity[]);
      }

      nodes.push(...localNodes);
    },
  );

  return nodes;
}
