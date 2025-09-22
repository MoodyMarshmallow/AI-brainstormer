"use client";

import { useEffect, type MouseEvent } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node
} from "reactflow";
import NodeRenderer, { type PersonaNodeData } from "./NodeRenderer";
import "reactflow/dist/style.css";

interface GraphCanvasProps {
  nodes: Node<PersonaNodeData>[];
  edges: Edge[];
  onNodeSelect: (id: string) => void;
}

function InnerCanvas({ nodes, edges, onNodeSelect }: GraphCanvasProps) {
  const instance = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      instance.fitView({ padding: 0.2, duration: 300 });
    }
  }, [nodes, instance]);

  return (
    <ReactFlow<PersonaNodeData>
      nodes={nodes}
      edges={edges}
      nodeTypes={{ personaNode: NodeRenderer }}
      onNodeClick={(_event: MouseEvent, node: Node) => onNodeSelect(node.id)}
      proOptions={{ hideAttribution: true }}
      fitView
      minZoom={0.2}
      maxZoom={1.5}
    >
      <Background color="#2dd4bf" gap={32} />
      <MiniMap pannable zoomable />
      <Controls />
    </ReactFlow>
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <div className="h-[70vh] w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        <InnerCanvas {...props} />
      </div>
    </ReactFlowProvider>
  );
}

export default GraphCanvas;
