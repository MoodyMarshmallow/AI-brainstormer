import { describe, expect, it } from "vitest";
import { computeTreeLayout } from "@/lib/layout";
import type { NodeRecord } from "@/lib/types";

const baseNode = (overrides: Partial<NodeRecord>): NodeRecord => ({
  id: overrides.id ?? "id",
  sessionId: overrides.sessionId ?? "session",
  parentId: overrides.parentId ?? null,
  persona: overrides.persona ?? "user",
  content: overrides.content ?? "content",
  x: overrides.x ?? null,
  y: overrides.y ?? null,
  createdAt: overrides.createdAt ?? new Date().toISOString()
});

describe("computeTreeLayout", () => {
  it("places nodes per depth", async () => {
    const createdAt = new Date().toISOString();
    const nodes: NodeRecord[] = [
      baseNode({ id: "root", createdAt }),
      baseNode({ id: "child1", parentId: "root", createdAt }),
      baseNode({ id: "child2", parentId: "root", createdAt }),
      baseNode({ id: "grandchild", parentId: "child1", createdAt })
    ];

    const layout = await computeTreeLayout(nodes);
    expect(layout.root.y).toBe(0);
    expect(layout.child1.y).toBeGreaterThan(layout.root.y);
    expect(layout.child1.x).not.toBe(layout.child2.x);
    expect(layout.grandchild.y).toBeGreaterThan(layout.child1.y);
  });
});
