"use client";

import { useState } from "react";
import { followUser } from "@/app/community/actions";

export function FollowButton({ userId, isFollowing: initial }: { userId: string; isFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initial);

  return (
    <button
      onClick={async () => { await followUser(userId); setIsFollowing(!isFollowing); }}
      className={`rounded-full px-5 py-2 text-sm font-bold transition ${
        isFollowing ? "bg-white/10 text-white hover:bg-white/20" : "bg-brand-500 text-white hover:bg-brand-600"
      }`}
    >
      {isFollowing ? "✓ Following" : "+ Follow"}
    </button>
  );
}
