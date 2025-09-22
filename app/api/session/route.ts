import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getSessionById, getSessionByShareToken } from "@/lib/db";

const CreateSessionSchema = z.object({
  title: z.string().min(1).max(120)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title } = CreateSessionSchema.parse(body);
    const session = await createSession(title);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to create session", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  if (!id && !token) {
    return NextResponse.json({ error: "Missing id or token" }, { status: 400 });
  }

  const result = id
    ? await getSessionById(id)
    : await getSessionByShareToken(token!);

  if (!result) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
