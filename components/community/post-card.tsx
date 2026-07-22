"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, CheckCircle2, Github, Globe } from "lucide-react";
import { votePost, savePost, followUser } from "@/app/community/actions";
import { ScrollReveal } from "@/components/scroll-reveal";

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

// Fully-expanded theme classes keep Tailwind's static scanner happy and
// avoid accidentally applying the dark text color in light mode.
const postTypeColors: Record<string, string> = {
  discussion: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  question: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  showcase: "bg-green-50 text-green-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  tutorial: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  research: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  career: "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  challenge: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  job: "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
  team_finder: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  resource: "bg-lime-50 text-lime-700 dark:bg-lime-950/50 dark:text-lime-300",
  event: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  meme: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300",
};

const postTypeIcons: Record<string, string> = {
  discussion: "💬", question: "❓", showcase: "🚀", tutorial: "📚",
  research: "📄", career: "💼", challenge: "🏆", job: "💼",
  team_finder: "🔍", resource: "📎", event: "📅", meme: "😂",
};

// Status badge colors with dark mode support
const statusColors = {
  pinned: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
  featured: "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300",
  solved: "bg-green-50 text-green-700 dark:bg-emerald-950/50 dark:text-emerald-300",
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
  const colorClass = postTypeColors[postType] ?? "bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300";
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
    <ScrollReveal direction="up" className="card-interactive group relative overflow-hidden">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative mb-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${colorClass}`}>
          {icon} {postType.replace("_", " ")}
        </span>
        {isPinned && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors.pinned}`}>📌 Pinned</span>}
        {isFeatured && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors.featured}`}>⭐ Featured</span>}
        {isSolved && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColors.solved}`}>✅ Solved</span>}
        {communityName && (
          <Link href={`/community/community/${communitySlug}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors">
            {communityEmoji} {communityName}
          </Link>
        )}
      </div>

      <Link href={`/community/post/${id}`} className="block">
        <h3 className="text-lg font-bold text-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-200">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-secondary">{content}</p>
      </Link>

      {(repoUrl || liveUrl) && (
        <div className="relative mt-3 flex gap-3">
          {repoUrl && (
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors">
              <Github className="h-3.5 w-3.5" /> Repo
            </a>
          )}
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
              <Globe className="h-3.5 w-3.5" /> Live
            </a>
          )}
        </div>
      )}

      {techStack && techStack.length > 0 && (
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {techStack.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-secondary dark:bg-slate-800/50 dark:text-slate-300">
              {t}
            </span>
          ))}
        </div>
      )}

      {jobCompany && (
        <p className="relative mt-2 text-sm font-medium text-secondary">
          {jobCompany} {jobType && <span className="text-xs text-subtle">· {jobType.replace("_", " ")}</span>}
        </p>
      )}

      <div className="relative mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <Link href={`/community/members/${authorUsername ?? authorId}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
            {authorName?.charAt(0)?.toUpperCase() ?? "?"}
          </Link>
          <div>
            <Link href={`/community/members/${authorUsername ?? authorId}`} className="text-sm font-semibold text-primary hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {authorName}
            </Link>
            <p className="text-xs text-subtle">{timeAgo}</p>
          </div>
          {currentUserId && currentUserId !== authorId && (
            <button 
              onClick={handleFollow} 
              className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold transition-all duration-200 ${
                following 
                  ? "bg-slate-100 text-secondary hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/50" 
                  : "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300 dark:hover:bg-brand-900/50"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleVote(1)} 
            className={`flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm transition-all duration-200 ${
              votes.myVote === 1 
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" 
                : "text-subtle hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/50 dark:hover:text-primary"
            }`}
          >
            <ArrowBigUp className="h-4 w-4" />{votes.up}
          </button>
          <button 
            onClick={() => handleVote(-1)} 
            className={`flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm transition-all duration-200 ${
              votes.myVote === -1 
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" 
                : "text-subtle hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800/50 dark:hover:text-rose-400"
            }`}
          >
            <ArrowBigDown className="h-4 w-4" />
          </button>
          <Link href={`/community/post/${id}`} className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm text-subtle hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/50 dark:hover:text-primary transition-all duration-200">
            <MessageSquare className="h-4 w-4" />{commentCount}
          </Link>
          <button 
            onClick={handleSave} 
            className={`rounded-lg p-1.5 text-sm transition-all duration-200 ${
              saved 
                ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30" 
                : "text-subtle hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/50 dark:hover:text-primary"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
          <button 
            onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/community/post/${id}`); }} 
            className="rounded-lg p-1.5 text-sm text-subtle hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/50 dark:hover:text-primary transition-all duration-200"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </ScrollReveal>
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