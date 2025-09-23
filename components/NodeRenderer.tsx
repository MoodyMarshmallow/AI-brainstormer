"use client";

import type { NodeProps } from "reactflow";
import { sanitizeContent } from "@/lib/sanitize";
import type { Persona } from "@/lib/types";

export interface PersonaNodeData {
  id: string;
  content: string;
  persona: Persona;
  collapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onSelect: (id: string) => void;
}

const personaStyles: Record<Persona | "user", { background: string; borderColor: string; labelColor?: string }> = {
  user: {
    background: "var(--bg-blue)",
    borderColor: "var(--blue)",
  },
  optimist: {
    background: "var(--bg-green)",
    borderColor: "var(--green)",
  },
  pessimist: {
    background: "var(--bg-red)",
    borderColor: "var(--red)",
  },
  realist: {
    background: "var(--bg-visual)",
    borderColor: "var(--grey-2)",
    labelColor: "var(--grey-2)",
  },
};

export function NodeRenderer({ data }: NodeProps<PersonaNodeData>) {
  const safeHtml = sanitizeContent(data.content);
  const style = personaStyles[data.persona] ?? personaStyles.user;

  return (
    <div
      className="w-64 rounded-lg border px-3 py-2 text-sm shadow-sm transition hover:shadow-md"
      style={{
        background: style.background,
        borderColor: style.borderColor,
        color: "var(--fg)",
      }}
      onClick={() => data.onSelect(data.id)}
    >
      <div
        className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide"
        style={{ color: style.labelColor ?? "var(--fg)" }}
      >
        <span>{data.persona}</span>
        <button
          type="button"
          className="rounded bg-[var(--bg-4)] px-2 py-1 text-[10px] font-semibold uppercase text-[var(--fg)] transition hover:bg-[var(--bg-3)]"
          onClick={(event) => {
            event.stopPropagation();
            data.onToggleCollapse(data.id);
          }}
        >
          {data.collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      <div
        className="prose max-w-none text-[var(--fg)]"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}

export default NodeRenderer;
