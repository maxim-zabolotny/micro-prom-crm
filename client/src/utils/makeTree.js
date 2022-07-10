/*external modules*/
import _ from "lodash";

/*other*/

export function makeTree(nodes, key, id, transformer = (v) => v) {
  return _.chain(nodes)
    .filter((node) => node[key] === id)
    .reduce(
      (tree, node) => [
        ...tree,
        {
          ...transformer(_.omit(node, key)),
          children: makeTree(nodes, key, _.get(node, "id"), transformer),
        },
      ],
      []
    )
    .value();
}
