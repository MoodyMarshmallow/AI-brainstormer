"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Edge, Node } from "reactflow";
import GraphCanvas from "./GraphCanvas";
import PromptBar from "./PromptBar";
import { mergePositions, type PositionedNode } from "@/lib/layout";
import type { BrainstormResponseBody, NodeRecord, Session } from "@/lib/types";
import type { PersonaNodeData } from "./NodeRenderer";

interface SessionViewProps {
  session: Session;
  initialNodes: NodeRecord[];
}

export function SessionView({ session, initialNodes }: SessionViewProps) {
  const [nodes, setNodes] = useState<NodeRecord[]>(initialNodes);
  const [positioned, setPositioned] = useState<PositionedNode[]>(() =>
    initialNodes.map((node) => ({
      ...node,
      position: { x: node.x ?? 0, y: node.y ?? 0 }
    }))
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialNodes.find((node) => node.persona === "user")?.id ?? null
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  useEffect(() => {
    let cancelled = false;

    mergePositions(nodes)
      .then((layout) => {
        if (!cancelled) {
          setPositioned(layout);
        }
      })
      .catch((layoutError) => {
        console.error("Failed to layout nodes", layoutError);
        if (!cancelled) {
          setPositioned(
            nodes.map((node) => ({
              ...node,
              position: { x: node.x ?? 0, y: node.y ?? 0 }
            }))
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nodes]);

  const flowNodes: Node<PersonaNodeData>[] = useMemo(
    () =>
      positioned.map((node) => ({
        id: node.id,
        position: node.position,
          data: {
            id: node.id,
            content: node.content,
            persona: node.persona,
            hasIncoming: Boolean(node.parentId),
            onSelect: (id: string) => setSelectedNodeId(id)
          },
        type: "personaNode",
        draggable: false,
        selectable: true,
        selected: selectedNodeId === node.id
      })),
    [positioned, selectedNodeId]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      positioned
        .filter((node) => node.parentId)
        .map((node) => ({
          id: `${node.parentId}-${node.id}`,
          source: node.parentId!,
          target: node.id,
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "var(--grey-2)",
            strokeWidth: 1.5,
            strokeDasharray: "4 4"
          }
        })),
    [positioned]
  );

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;

  const submitPrompt = async (prompt: string) => {
    setError(null);
    const response = await fetch("/api/brainstorm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        prompt,
        parentNodeId: selectedNode?.id ?? null
      })
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!response.ok) {
      throw new Error((payload.error as string | undefined) ?? "Request failed");
    }

    const data = payload as unknown as BrainstormResponseBody;
    setNodes((prev) => [...prev, data.userNode, ...data.children]);
    setSelectedNodeId(data.userNode.id);
  };

  const handleSubmit = (prompt: string) =>
    new Promise<void>((resolve, reject) => {
      startTransition(() => {
        submitPrompt(prompt)
          .then(resolve)
          .catch((err) => {
            setError((err as Error).message);
            reject(err);
          });
      });
    });

  return (
    <section className="flex flex-1 flex-col gap-4 text-[var(--fg)]">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--fg)]">{session.title ?? "Untitled Session"}</h1>
        <p className="text-sm text-[var(--grey-1)]">Share link: /s/{session.shareToken}</p>
      </header>
      <GraphCanvas
        nodes={flowNodes}
        edges={flowEdges}
        onNodeSelect={(id) => setSelectedNodeId(id)}
      />
      <PromptBar onSubmit={handleSubmit} loading={isPending} />
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
    </section>
  );
}

export default SessionView;
