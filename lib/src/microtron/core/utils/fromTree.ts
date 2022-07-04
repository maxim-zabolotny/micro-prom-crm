/*external modules*/
import _ from 'lodash';
/*other*/

export function fromTree<
  TEntity extends object & { children: TEntity[] },
  TTree extends Array<TEntity>,
>(tree: TTree, idKey: string, parentIdKey: string): TEntity[] {
  const nodes: TEntity[] = [];

  tree.forEach(
    (node: TEntity) => {
      const localNodes: TEntity[] = [];

      const rootNode = _.omit(node, 'children');
      if (_.isEmpty(_.get(rootNode, parentIdKey))) {
        _.set(rootNode, parentIdKey, 0);
      }

      localNodes.push(rootNode as TEntity);

      if (node.children.length > 0) {
        localNodes.push(
          ...fromTree(
            _.map(node.children, (childNode) => {
              _.set(childNode, parentIdKey, _.get(rootNode, idKey));
              return childNode;
            }),
            idKey,
            parentIdKey,
          ) as TEntity[],
        );
      }

      nodes.push(...localNodes);
    },
  );

  return nodes;
}
