import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSession(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete session", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
