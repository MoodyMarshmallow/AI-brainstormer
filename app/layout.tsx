import type { Metadata } from "next";
import "./globals.css";
import { SessionSidebar } from "@/components/SessionSidebar";
import { listSessions } from "@/lib/db";

export const metadata: Metadata = {
  title: "AI Brainstormer",
  description: "Mind-map brainstorming with persona fan-out"
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const sessions = await listSessions();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 p-4 md:gap-6">
          <SessionSidebar sessions={sessions} />
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-2 md:p-4">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
