"use client";

import { useState } from "react";
import type { NodeRecord } from "@/lib/types";

interface PromptBarProps {
  selectedNode: NodeRecord | null;
  onSubmit: (prompt: string) => Promise<void>;
  loading: boolean;
}

export function PromptBar({ selectedNode, onSubmit, loading }: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Enter a prompt to brainstorm");
      return;
    }
    setError(null);
    try {
      await onSubmit(prompt.trim());
      setPrompt("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex w-full flex-col gap-3">
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={3}
        placeholder="Ask a question or propose an idea..."
        className="w-full rounded-md border border-[var(--bg-4)] bg-[var(--bg-1)] p-3 text-base text-[var(--fg)]"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="self-end rounded-md bg-[var(--blue-4)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Thinking..." : "Brainstorm"}
      </button>
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
    </form>
  );
}

export default PromptBar;
