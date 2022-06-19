import _ from "lodash";

export function fromTree<TTree, TKey>(tree: TTree) {
    const nodes = [];

    tree.forEach(
        node => {
            const localNodes = [_.omit(node, 'children')];
            if(node.children.length > 0) {
                localNodes.push(...fromTree(node.children))
            }

            nodes.push(...localNodes)
        }
    )

    return nodes;
}
