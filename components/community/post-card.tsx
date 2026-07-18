"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, UserPlus, CheckCircle2, Github, Globe } from "lucide-react";
import { votePost, savePost, followUser } from "@/app/community/actions";

export type PostCardData = {
  id: string;
  title: string;
  content: string;
  postType: string;
  authorName: string;
  authorUsername?: string;
  authorId: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  saveCount: number;
  isSolved?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  communityName?: string;
  communityEmoji?: string;
  communitySlug?: string;
  repoUrl?: string | null;
  liveUrl?: string | null;
  techStack?: string[] | null;
  jobType?: string | null;
  jobCompany?: string | null;
  createdAt: string;
  currentUserVote?: number;
  isSaved?: boolean;
  isFollowing?: boolean;
  currentUserId?: string;
};

const postTypeColors: Record<string, string> = {
  discussion: "bg-blue-50 text-blue-700", question: "bg-amber-50 text-amber-700",
  showcase: "bg-green-50 text-green-700", tutorial: "bg-purple-50 text-purple-700",
  research: "bg-indigo-50 text-indigo-700", career: "bg-pink-50 text-pink-700",
  challenge: "bg-orange-50 text-orange-700", job: "bg-teal-50 text-teal-700",
  team_finder: "bg-cyan-50 text-cyan-700", resource: "bg-lime-50 text-lime-700",
  event: "bg-rose-50 text-rose-700", meme: "bg-fuchsia-50 text-fuchsia-700",
};

const postTypeIcons: Record<string, string> = {
  discussion: "💬", question: "❓", showcase: "🚀", tutorial: "📚",
  research: "📄", career: "💼", challenge: "🏆", job: "💼",
  team_finder: "🔍", resource: "📎", event: "📅", meme: "😂",
};

export function PostCard({
  id, title, content, postType, authorName, authorUsername, authorId,
  upvotes, downvotes, commentCount, saveCount, isSolved, isFeatured, isPinned,
  communityName, communityEmoji, communitySlug,
  repoUrl, liveUrl, techStack, jobType, jobCompany,
  createdAt, currentUserVote, isSaved, isFollowing, currentUserId,
}: PostCardData) {
  const [votes, setVotes] = useState({ up: upvotes, down: downvotes, myVote: currentUserVote ?? 0 });
  const [saved, setSaved] = useState(isSaved ?? false);
  const [following, setFollowing] = useState(isFollowing ?? false);

  const timeAgo = getTimeAgo(createdAt);
  const colorClass = postTypeColors[postType] ?? "bg-slate-50 text-slate-700";
  const icon = postTypeIcons[postType] ?? "📝";

  async function handleVote(type: 1 | -1) {
    await votePost(id, type);
    if (votes.myVote === type) {
      setVotes((v) => ({ up: v.up - (type === 1 ? 1 : 0), down: v.down - (type === -1 ? 1 : 0), myVote: 0 }));
    } else {
      const prevVote = votes.myVote;
      setVotes((v) => ({
        up: v.up + (type === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0),
        down: v.down + (type === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0),
        myVote: type,
      }));
    }
  }

  async function handleSave() {
    await savePost(id);
    setSaved(!saved);
  }

  async function handleFollow() {
    await followUser(authorId);
    setFollowing(!following);
  }

  return (
    <article className="card group relative">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${colorClass}`}>
          {icon} {postType.replace("_", " ")}
        </span>
        {isPinned && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">📌 Pinned</span>}
        {isFeatured && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">⭐ Featured</span>}
        {isSolved && <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">✅ Solved</span>}
        {communityName && (
          <Link href={`/community/community/${communitySlug}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
            {communityEmoji} {communityName}
          </Link>
        )}
      </div>

      <Link href={`/community/post/${id}`}>
        <h3 className="text-lg font-bold group-hover:text-brand-700">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{content}</p>
      </Link>

      {(repoUrl || liveUrl) && (
        <div className="mt-3 flex gap-3">
          {repoUrl && <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-ink"><Github className="h-3.5 w-3.5" /> Repo</a>}
          {liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-600"><Globe className="h-3.5 w-3.5" /> Live</a>}
        </div>
      )}

      {techStack && techStack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {techStack.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{t}</span>)}
        </div>
      )}

      {jobCompany && (
        <p className="mt-2 text-sm font-medium text-slate-700">{jobCompany} {jobType && <span className="text-xs text-slate-500">· {jobType.replace("_", " ")}</span>}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <Link href={`/community/members/${authorUsername ?? authorId}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            {authorName?.charAt(0)?.toUpperCase() ?? "?"}
          </Link>
          <div>
            <Link href={`/community/members/${authorUsername ?? authorId}`} className="text-sm font-semibold hover:text-brand-700">{authorName}</Link>
            <p className="text-xs text-slate-400">{timeAgo}</p>
          </div>
          {currentUserId && currentUserId !== authorId && (
            <button onClick={handleFollow} className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold transition ${following ? "bg-slate-100 text-slate-600" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}>
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handleVote(1)} className={`flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm transition ${votes.myVote === 1 ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"}`}>
            <ArrowBigUp className="h-4 w-4" />{votes.up}
          </button>
          <button onClick={() => handleVote(-1)} className={`flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm transition ${votes.myVote === -1 ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-50"}`}>
            <ArrowBigDown className="h-4 w-4" />
          </button>
          <Link href={`/community/post/${id}`} className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-50">
            <MessageSquare className="h-4 w-4" />{commentCount}
          </Link>
          <button onClick={handleSave} className={`rounded-lg p-1.5 text-sm transition ${saved ? "text-amber-500" : "text-slate-500 hover:bg-slate-50"}`}>
            <Bookmark className="h-4 w-4" />
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/community/post/${id}`); }} className="rounded-lg p-1.5 text-sm text-slate-500 hover:bg-slate-50">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
