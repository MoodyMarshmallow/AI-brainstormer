declare module "reactflow" {
  import type { ComponentType, ReactNode, MouseEvent } from "react";

  export type XYPosition = { x: number; y: number };

  export interface NodeProps<TData = unknown> {
    id: string;
    data: TData;
    type?: string;
    selected: boolean;
    dragging?: boolean;
  }

  export type Node<TData = unknown> = {
    id: string;
    type?: string;
    data: TData;
    position: XYPosition;
    selected?: boolean;
    dragging?: boolean;
    draggable?: boolean;
    selectable?: boolean;
    style?: Record<string, unknown>;
  };

  export type Edge<TData = unknown> = {
    id: string;
    source: string;
    target: string;
    type?: string;
    label?: ReactNode;
    data?: TData;
  };

  export interface ReactFlowInstance {
    fitView(options?: { padding?: number; duration?: number }): void;
  }

  export interface ReactFlowProps<NodeData = unknown, EdgeData = unknown> {
    nodes: Node<NodeData>[];
    edges: Edge<EdgeData>[];
    nodeTypes?: Record<string, ComponentType<NodeProps<NodeData>>>;
    onNodeClick?: (event: MouseEvent, node: Node<NodeData>) => void;
    proOptions?: { hideAttribution?: boolean };
    fitView?: boolean;
    minZoom?: number;
    maxZoom?: number;
    children?: ReactNode;
  }

  export default function ReactFlow<NodeData = unknown, EdgeData = unknown>(
    props: ReactFlowProps<NodeData, EdgeData>
  ): JSX.Element;

  export const Background: ComponentType<Record<string, unknown>>;
  export const Controls: ComponentType<Record<string, unknown>>;
  export const MiniMap: ComponentType<Record<string, unknown>>;
  export const ReactFlowProvider: ComponentType<{ children?: ReactNode }>;
  export function useReactFlow(): ReactFlowInstance;
}
