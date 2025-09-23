import { NextResponse, type NextRequest } from "next/server";
import { deleteSession } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSession(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete session", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
