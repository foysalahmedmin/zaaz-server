import { TCategoryTree } from './category.type';

export const buildTree = (
  roots: TCategoryTree[],
  nodes: TCategoryTree[],
): TCategoryTree[] => {
  const map = new Map<string, TCategoryTree>(
    nodes.map((n) => [
      String(n._id),
      { ...n, children: [] as TCategoryTree[] },
    ]),
  );

  nodes.forEach((n) => {
    if (n.category && map.has(String(n.category))) {
      map.get(String(n.category))!.children!.push(map.get(String(n._id))!);
    }
  });

  return roots
    .map((root) => map.get(String(root._id)))
    .filter((x): x is TCategoryTree => Boolean(x));
};
