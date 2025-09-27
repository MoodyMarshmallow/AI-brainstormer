import ELK from "elkjs/lib/elk.bundled.js";
import type { NodeRecord } from "./types";

export interface PositionedNode extends NodeRecord {
  position: { x: number; y: number };
}

const DEFAULT_WIDTH = 256;
const DEFAULT_HEIGHT = 140;
const elk = new ELK();
const VERTICAL_GAP = 160;
const HORIZONTAL_GAP = 260;

export async function computeTreeLayout(
  nodes: NodeRecord[]
): Promise<Record<string, { x: number; y: number }>> {
  if (nodes.length === 0) {
    return {};
  }

  try {
    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "mrtree",
        "elk.direction": "DOWN",
        "elk.spacing.nodeNode": "80",
        "elk.spacing.level": "160",
        "elk.padding": "[top=20,left=20,bottom=20,right=20]"
      },
      children: nodes.map((node) => ({
        id: node.id,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT
      })),
      edges: nodes
        .filter((node) => node.parentId)
        .map((node) => ({
          id: `${node.parentId}-${node.id}`,
          sources: [node.parentId!],
          targets: [node.id]
        }))
    } satisfies Parameters<typeof elk.layout>[0];

    const result = await elk.layout(graph);
    const positions: Record<string, { x: number; y: number }> = {};

    for (const child of result.children ?? []) {
      positions[child.id] = {
        x: child.x ?? 0,
        y: child.y ?? 0
      };
    }

    return positions;
  } catch (error) {
    console.warn("ELK layout failed, falling back to simple layout", error);
    return fallbackTreeLayout(nodes);
  }
}

export async function mergePositions(nodes: NodeRecord[]): Promise<PositionedNode[]> {
  const layout = await computeTreeLayout(nodes);
  return nodes.map((node) => ({
    ...node,
    position: layout[node.id] ?? { x: 0, y: 0 }
  }));
}

function fallbackTreeLayout(nodes: NodeRecord[]): Record<string, { x: number; y: number }> {
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
