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

const personaColors: Record<Persona, string> = {
  user: "bg-slate-800 border-slate-600",
  optimist: "bg-emerald-900 border-emerald-500",
  pessimist: "bg-rose-900 border-rose-500",
  realist: "bg-blue-900 border-blue-500"
};

export function NodeRenderer({ data }: NodeProps<PersonaNodeData>) {
  const safeHtml = sanitizeContent(data.content);
  const classes = personaColors[data.persona] ?? personaColors.user;
  return (
    <div
      className={`w-64 rounded-lg border px-3 py-2 text-sm shadow-lg transition hover:border-white ${classes}`}
      onClick={() => data.onSelect(data.id)}
    >
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-200">
        <span>{data.persona}</span>
        <button
          type="button"
          className="rounded bg-slate-900 px-2 py-1 text-[10px] uppercase"
          onClick={(event) => {
            event.stopPropagation();
            data.onToggleCollapse(data.id);
          }}
        >
          {data.collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      <div className="prose prose-invert max-w-none text-slate-100" dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </div>
  );
}

export default NodeRenderer;
