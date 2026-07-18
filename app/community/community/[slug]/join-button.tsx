"use client";

import { useState } from "react";
import { joinCommunity } from "@/app/community/actions";

export function CommunityJoinButton({ communityId, isMember: initial }: { communityId: string; isMember: boolean }) {
  const [isMember, setIsMember] = useState(initial);

  return (
    <button
      onClick={async () => { await joinCommunity(communityId); setIsMember(!isMember); }}
      className={`rounded-full px-5 py-2 text-sm font-bold transition ${
        isMember ? "bg-white/10 text-white hover:bg-white/20" : "bg-brand-500 text-white hover:bg-brand-600"
      }`}
    >
      {isMember ? "✓ Joined" : "Join Community"}
    </button>
  );
}
