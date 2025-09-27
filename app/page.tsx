"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "Untitled Session" })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session (${response.status})`);
      }

      const data = await response.json();
      const token = data.session?.shareToken;
      if (!token) {
        throw new Error("Session missing share token");
      }
      router.push(`/s/${token}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 text-center text-[var(--fg)]">
      <h1 className="text-4xl font-semibold text-[var(--fg)]">AI Brainstormer</h1>
      <p className="max-w-xl text-[var(--grey-1)]">
        Kick off an idea and let Optimist, Pessimist and Realist personas expand the tree. Share the
        link to continue later.
      </p>
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Session title"
          className="rounded-md border border-[var(--bg-4)] bg-[var(--bg-1)] p-3 text-base text-[var(--fg)]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--blue-4)] p-3 text-base font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Brainstorm"}
        </button>
        {error && <p className="text-sm text-[var(--red)]">{error}</p>}
      </form>
    </main>
  );
}
