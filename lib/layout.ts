import type { NodeRecord } from "./types";

export interface PositionedNode extends NodeRecord {
  position: { x: number; y: number };
}

const VERTICAL_GAP = 160;
const HORIZONTAL_GAP = 260;

export function computeTreeLayout(nodes: NodeRecord[]): Record<string, { x: number; y: number }> {
  const nodeMap = new Map(nodes.map((node) => [node.id, node] as const));
  const depths = new Map<string, number>();

  const getDepth = (node: NodeRecord | undefined): number => {
    if (!node) return 0;
    if (depths.has(node.id)) return depths.get(node.id)!;
    const parent = node.parentId ? nodeMap.get(node.parentId) : undefined;
    const depth = parent ? getDepth(parent) + 1 : 0;
    depths.set(node.id, depth);
    return depth;
  };

  const layers = new Map<number, NodeRecord[]>();
  nodes
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((node) => {
      const depth = getDepth(node);
      const layer = layers.get(depth) ?? [];
      layer.push(node);
      layers.set(depth, layer);
    });

  const positions: Record<string, { x: number; y: number }> = {};

  Array.from(layers.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([depth, layer]) => {
      layer.forEach((node, index) => {
        positions[node.id] = {
          x: index * HORIZONTAL_GAP,
          y: depth * VERTICAL_GAP
        };
      });
    });

  return positions;
}

export function mergePositions(nodes: NodeRecord[]): PositionedNode[] {
  const layout = computeTreeLayout(nodes);
  return nodes.map((node) => ({
    ...node,
    position: layout[node.id] ?? { x: 0, y: 0 }
  }));
}
