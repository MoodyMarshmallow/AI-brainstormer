import { notFound } from "next/navigation";
import SessionView from "@/components/SessionView";
import { getSessionByShareToken } from "@/lib/db";

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

export const dynamic = "force-dynamic";

export default async function SessionPage(props: PageProps) {
  const params = await props.params;
  const result = await getSessionByShareToken(params.shareToken);
  if (!result) {
    notFound();
  }

  return <SessionView session={result.session} initialNodes={result.nodes} />;
}
