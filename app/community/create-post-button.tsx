"use client";

import Link from "next/link";

export function CommunityCreatePostButton({ username }: { username: string }) {
  return (
    <Link href="/community/create" className="card mb-6 flex items-center gap-4 hover:border-brand-500 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
        {username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
        Create a post...
      </div>
    </Link>
  );
}
