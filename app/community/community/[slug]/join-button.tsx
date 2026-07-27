"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { joinCommunity } from "@/app/community/actions";

export function CommunityJoinButton({
  communityId,
  isMember: initial,
  memberCount: initialCount,
}: {
  communityId: string;
  isMember: boolean;
  memberCount?: number;
}) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initial);
  const [memberCount, setMemberCount] = useState(initialCount ?? null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {memberCount !== null && (
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold tabular-nums">
          👥 {memberCount} members
        </span>
      )}
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const next = !isMember;
          // Optimistic UI update so the button + count react instantly.
          setIsMember(next);
          if (memberCount !== null) setMemberCount(memberCount + (next ? 1 : -1));
          await joinCommunity(communityId);
          // Re-fetch server data so the header count & membership stay in sync.
          await router.refresh();
          setBusy(false);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition disabled:opacity-60 ${
          isMember
            ? "bg-white/10 text-white hover:bg-white/20"
            : "bg-brand-500 text-white hover:bg-brand-600"
        }`}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {isMember ? "✓ Joined" : "Join Community"}
      </button>
    </div>
  );
}
