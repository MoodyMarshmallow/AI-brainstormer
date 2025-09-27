"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { sanitizeContent } from "@/lib/sanitize";
import type { Persona } from "@/lib/types";

export interface PersonaNodeData {
  id: string;
  content: string;
  persona: Persona;
  onSelect: (id: string) => void;
  hasIncoming: boolean;
}

const personaStyles: Record<
  Persona | "user",
  {
    idleBackground: string;
    activeBackground: string;
    idleBorder: string;
    activeBorder: string;
    labelColor?: string;
  }
> = {
  user: {
    idleBackground: "var(--blue-1)",
    activeBackground: "var(--blue-2)",
    idleBorder: "var(--blue-3)",
    activeBorder: "var(--blue-4)"
  },
  optimist: {
    idleBackground: "var(--green-1)",
    activeBackground: "var(--green-2)",
    idleBorder: "var(--green-3)",
    activeBorder: "var(--green-4)"
  },
  pessimist: {
    idleBackground: "var(--red-1)",
    activeBackground: "var(--red-2)",
    idleBorder: "var(--red-3)",
    activeBorder: "var(--red-4)"
  },
  realist: {
    idleBackground: "var(--yellow-1)",
    activeBackground: "var(--yellow-2)",
    idleBorder: "var(--yellow-3)",
    activeBorder: "var(--yellow-4)"
  },
};

export function NodeRenderer({ data, selected }: NodeProps<PersonaNodeData>) {
  const safeHtml = sanitizeContent(data.content);
  const style = personaStyles[data.persona] ?? personaStyles.user;
  const background = selected ? style.activeBackground : style.idleBackground;
  const borderColor = selected ? style.activeBorder : style.idleBorder;
  const labelColor = style.labelColor ?? "var(--fg)";
  const textColor = selected ? "var(--bg-0)" : "var(--fg)";

  return (
    <div
      className="w-64 rounded-lg border px-3 py-2 text-sm shadow-sm transition hover:shadow-md"
      style={{
        background,
        borderColor,
        color: textColor,
      }}
      onClick={() => data.onSelect(data.id)}
    >
      {data.hasIncoming ? (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: "var(--grey-2)", border: "none" }}
        />
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "var(--grey-2)", border: "none" }}
        isConnectable={false}
      />
      <div
        className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide"
        style={{ color: labelColor }}
      >
        <span>{data.persona}</span>
      </div>
      <div
        className="prose max-w-none text-[var(--fg)]"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}

export default NodeRenderer;
