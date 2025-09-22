import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Brainstormer",
  description: "Mind-map brainstorming with persona fan-out"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col p-4">
          {children}
        </div>
      </body>
    </html>
  );
}
