/*external modules*/
import _ from "lodash";

/*other*/

export function fromTree(tree, idKey, parentIdKey, transformer = (v) => v) {
  const nodes = [];

  tree.forEach((node) => {
    const localNodes = [];

    const rootNode = transformer(_.omit(node, "children"));
    if (_.isEmpty(_.get(rootNode, parentIdKey))) {
      _.set(rootNode, parentIdKey, 0);
    }

    localNodes.push(rootNode);

    if (node.children.length > 0) {
      localNodes.push(
        ...fromTree(
          _.map(node.children, (childNode) => {
            _.set(childNode, parentIdKey, _.get(rootNode, idKey));
            return transformer(childNode);
          }),
          idKey,
          parentIdKey,
          transformer
        )
      );
    }

    nodes.push(...localNodes);
  });

  return nodes;
}
