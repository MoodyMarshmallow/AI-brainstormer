import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";
import { generatePersonaReplies } from "@/lib/gemini";
import { getSessionById, insertChildren, insertNode } from "@/lib/db";

const BrainstormSchema = z.object({
  sessionId: z.string().uuid(),
  prompt: z.string().min(1).max(2000),
  parentNodeId: z.string().uuid().optional().nullable()
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: z.infer<typeof BrainstormSchema>;
  try {
    body = BrainstormSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await getSessionById(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const userNode = await insertNode({
      sessionId: body.sessionId,
      parentId: body.parentNodeId ?? null,
      persona: "user",
      content: body.prompt.trim()
    });

    const replies = await generatePersonaReplies(body.prompt);

    const children = await insertChildren(
      replies.map((reply) => ({
        sessionId: body.sessionId,
        parentId: userNode.id,
        persona: reply.persona,
        content: reply.content,
        x: null,
        y: null
      }))
    );

    return NextResponse.json({ userNode, children });
  } catch (error) {
    console.error("Brainstorm failed", error);
    return NextResponse.json({ error: "Brainstorm failed" }, { status: 500 });
  }
}
