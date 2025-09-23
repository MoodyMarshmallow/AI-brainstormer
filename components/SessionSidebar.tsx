'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Session } from '@/lib/types';

interface SessionSidebarProps {
  sessions: Session[];
}

export function SessionSidebar({ sessions }: SessionSidebarProps) {
  const pathname = usePathname();

  if (sessions.length === 0) {
    return (
      <aside className="hidden w-64 shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:flex">
        <h2 className="text-sm font-semibold uppercase text-slate-300">Sessions</h2>
        <p className="mt-4 text-sm text-slate-500">Start a brainstorm to see it here.</p>
      </aside>
    );
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:flex">
      <h2 className="text-sm font-semibold uppercase text-slate-300">Sessions</h2>
      <nav className="mt-3 space-y-1 overflow-y-auto pr-1 text-sm">
        {sessions.map((session) => (
          <SessionListItem
            key={session.id}
            session={session}
            active={pathname?.includes(`/s/${session.shareToken}`)}
          />
        ))}
      </nav>
    </aside>
  );
}

interface SessionListItemProps {
  session: Session;
  active: boolean;
}

function SessionListItem({ session, active }: SessionListItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.error('Failed to delete session');
        return;
      }
      router.refresh();
    });
  };

  return (
    <Link
      href={`/s/${session.shareToken}`}
      className={`group flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-slate-800/70 ${
        active ? 'bg-slate-800/80 text-slate-50' : 'text-slate-300'
      }`}
      prefetch={false}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{session.title ?? 'Untitled session'}</span>
        <span className="text-xs text-slate-500">
          {new Date(session.createdAt).toLocaleString()}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Delete session"
        className="ml-2 hidden rounded p-1 text-slate-400 transition hover:bg-slate-700 hover:text-red-400 group-hover:flex"
        disabled={pending}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </Link>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
      <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
    </svg>
  );
}
