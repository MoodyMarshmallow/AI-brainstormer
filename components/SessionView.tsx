"use client";

import { useMemo, useState, useTransition } from "react";
import type { Edge, Node } from "reactflow";
import GraphCanvas from "./GraphCanvas";
import PromptBar from "./PromptBar";
import { mergePositions } from "@/lib/layout";
import type { BrainstormResponseBody, NodeRecord, Session } from "@/lib/types";
import type { PersonaNodeData } from "./NodeRenderer";

interface SessionViewProps {
  session: Session;
  initialNodes: NodeRecord[];
}

export function SessionView({ session, initialNodes }: SessionViewProps) {
  const [nodes, setNodes] = useState<NodeRecord[]>(initialNodes);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialNodes.find((node) => node.persona === "user")?.id ?? null
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const visibleNodes = useMemo(() => {
    const hasCollapsedAncestor = (node: NodeRecord | undefined): boolean => {
      if (!node || !node.parentId) return false;
      if (collapsed.has(node.parentId)) return true;
      const parent = nodeMap.get(node.parentId);
      return hasCollapsedAncestor(parent);
    };

    return nodes.filter((node) => !hasCollapsedAncestor(node));
  }, [nodes, collapsed, nodeMap]);

  const positioned = useMemo(() => mergePositions(visibleNodes), [visibleNodes]);

  const flowNodes: Node<PersonaNodeData>[] = useMemo(
    () =>
      positioned.map((node) => ({
        id: node.id,
        position: node.position,
        data: {
          id: node.id,
          content: node.content,
          persona: node.persona,
          collapsed: collapsed.has(node.id),
          onToggleCollapse: (id: string) =>
            setCollapsed((prev) => {
              const next = new Set(prev);
              if (next.has(id)) {
                next.delete(id);
              } else {
                next.add(id);
              }
              return next;
            }),
          onSelect: (id: string) => setSelectedNodeId(id)
        },
        type: "personaNode",
        draggable: false,
        selectable: true,
        selected: selectedNodeId === node.id
      })),
    [positioned, collapsed, selectedNodeId]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      positioned
        .filter((node) => node.parentId)
        .map((node) => ({
          id: `${node.parentId}-${node.id}`,
          source: node.parentId!,
          target: node.id,
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 1.5 }
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
    <section className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{session.title ?? "Untitled Session"}</h1>
        <p className="text-sm text-slate-400">Share link: /s/{session.shareToken}</p>
      </header>
      <GraphCanvas
        nodes={flowNodes}
        edges={flowEdges}
        onNodeSelect={(id) => setSelectedNodeId(id)}
      />
      <PromptBar selectedNode={selectedNode} onSubmit={handleSubmit} loading={isPending} />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}

export default SessionView;
