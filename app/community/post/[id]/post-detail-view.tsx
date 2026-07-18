"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowBigUp, ArrowBigDown, MessageSquare, Bookmark, Share2, UserPlus, CheckCircle2, Github, Globe, Calendar, MapPin, Loader2, Lightbulb, Zap, Trophy } from "lucide-react";
import { votePost, savePost, followUser, createComment, acceptAnswer, rsvpEvent, submitChallengeEntry } from "@/app/community/actions";

type CommentData = {
  id: string;
  content: string;
  is_best_answer: boolean;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; username: string | null } | null;
};

type ChallengeEntry = {
  id?: string;
  title: string;
  repo_url?: string | null;
  live_url?: string | null;
  profiles?: { full_name: string | null; username: string | null } | null;
};

type Props = {
  id: string;
  title: string;
  content: string;
  postType: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isSolved: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  repoUrl: string | null;
  liveUrl: string | null;
  demoVideoUrl: string | null;
  techStack: string[] | null;
  jobType: string | null;
  jobCompany: string | null;
  jobLocation: string | null;
  eventType: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  challengeDeadline: string | null;
  resourceType: string | null;
  resourceUrl: string | null;
  linkUrl: string | null;
  tags: string[];
  createdAt: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  communityName: string | null;
  communityEmoji: string | null;
  communitySlug: string | null;
  authorXpLevel: number;
  authorXpXp: number;
  isFollowing: boolean;
  userVote: number;
  isSaved: boolean;
  rsvpCount: number;
  isRsvped: boolean;
  challengeEntries: ChallengeEntry[];
  comments: CommentData[];
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

export function PostDetailView({
  id, title, content, postType, upvotes, downvotes, commentCount,
  isSolved, isFeatured, isPinned, repoUrl, liveUrl, demoVideoUrl, techStack,
  jobType, jobCompany, jobLocation, eventType, eventDate, eventLocation,
  challengeDeadline, resourceType, resourceUrl, linkUrl, tags, createdAt,
  authorId, authorName, authorUsername, communityName, communityEmoji, communitySlug,
  authorXpLevel, authorXpXp, isFollowing: initialFollowing, userVote: initialVote,
  isSaved: initialSaved, rsvpCount, isRsvped: initialRsvped, challengeEntries, comments, currentUserId,
}: Props) {
  const [votes, setVotes] = useState({ up: upvotes, down: downvotes, myVote: initialVote });
  const [saved, setSaved] = useState(initialSaved);
  const [following, setFollowing] = useState(initialFollowing);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rsvped, setRsvped] = useState(initialRsvped);
  const [currentRsvpCount, setCurrentRsvpCount] = useState(rsvpCount);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const isQuestion = postType === "question";
  const isEvent = postType === "event";
  const isChallenge = postType === "challenge";
  const colorClass = postTypeColors[postType] ?? "bg-slate-50 text-slate-700";

  async function handleVote(type: 1 | -1) {
    await votePost(id, type);
    if (votes.myVote === type) {
      setVotes((v) => ({ up: v.up - (type === 1 ? 1 : 0), down: v.down - (type === -1 ? 1 : 0), myVote: 0 }));
    } else {
      const prev = votes.myVote;
      setVotes((v) => ({ up: v.up + (type === 1 ? 1 : 0) - (prev === 1 ? 1 : 0), down: v.down + (type === -1 ? 1 : 0) - (prev === -1 ? 1 : 0), myVote: type }));
    }
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    setSubmitting(true);
    await createComment(id, commentText, replyTo ?? undefined);
    setCommentText("");
    setReplyTo(null);
    setSubmitting(false);
  }

  async function handleRsvp() {
    await rsvpEvent(id);
    setRsvped(!rsvped);
    setCurrentRsvpCount(rsvped ? currentRsvpCount - 1 : currentRsvpCount + 1);
  }

  async function handleAiSuggestion() {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `You are an AI mentor on CalibiAI Community. A student asked: "${title} - ${content}". Provide a helpful, concise answer with actionable advice. Keep it under 200 words.` }),
      });
      if (res.ok) { const data = await res.json(); setAiAnswer(data.answer); }
    } catch { /* ignore */ }
    setLoadingAi(false);
  }

  return (
    <div>
      <Link href="/community" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Community
      </Link>

      <article className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${colorClass}`}>{postType.replace("_", " ")}</span>
          {isPinned && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">📌 Pinned</span>}
          {isFeatured && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">⭐ Featured</span>}
          {isSolved && <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">✅ Solved</span>}
          {communityName && (
            <Link href={`/community/community/${communitySlug}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
              {communityEmoji} {communityName}
            </Link>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-black">{title}</h1>

        {/* Author */}
        <div className="mt-4 flex items-center gap-3">
          <Link href={`/community/members/${authorUsername ?? authorId}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            {authorName?.charAt(0)?.toUpperCase() ?? "?"}
          </Link>
          <div>
            <Link href={`/community/members/${authorUsername ?? authorId}`} className="font-semibold hover:text-brand-700">{authorName}</Link>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{getTimeAgo(createdAt)}</span>
              {authorXpXp > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700 font-semibold">Level {authorXpLevel} · {authorXpXp} XP</span>}
            </div>
          </div>
          {currentUserId && currentUserId !== authorId && (
            <button onClick={async () => { await followUser(authorId); setFollowing(!following); }} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${following ? "bg-slate-100 text-slate-600" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}>
              <UserPlus className="mr-1 inline h-3 w-3" />{following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-6 whitespace-pre-wrap text-slate-700 leading-relaxed">{content}</div>

        {/* Showcase links */}
        {(repoUrl || liveUrl || demoVideoUrl) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {repoUrl && <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"><Github className="h-4 w-4" />GitHub Repo</a>}
            {liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"><Globe className="h-4 w-4" />Live Demo</a>}
            {demoVideoUrl && <a href={demoVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">🎬 Demo Video</a>}
          </div>
        )}

        {/* Tech stack */}
        {techStack && techStack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {techStack.map((t) => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{t}</span>)}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => <span key={t} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">#{t}</span>)}
          </div>
        )}

        {/* Event details */}
        {isEvent && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {eventDate && <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="h-4 w-4 text-brand-600" />{new Date(eventDate).toLocaleString()}</div>}
            {eventType && <div className="flex items-center gap-2 text-sm text-slate-600"><Zap className="h-4 w-4 text-brand-600" />{eventType.replace("_", " ")}</div>}
            {eventLocation && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-brand-600" />{eventLocation}</div>}
          </div>
        )}

        {/* Job details */}
        {postType === "job" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {jobCompany && <div className="rounded-lg border border-slate-200 p-3 text-sm"><span className="text-slate-500">Company</span><p className="font-semibold">{jobCompany}</p></div>}
            {jobType && <div className="rounded-lg border border-slate-200 p-3 text-sm"><span className="text-slate-500">Type</span><p className="font-semibold capitalize">{jobType.replace("_", " ")}</p></div>}
            {jobLocation && <div className="rounded-lg border border-slate-200 p-3 text-sm"><span className="text-slate-500">Location</span><p className="font-semibold">{jobLocation}</p></div>}
          </div>
        )}

        {/* Resource link */}
        {resourceUrl && (
          <div className="mt-4">
            <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
              📎 Open Resource ({resourceType?.replace("_", " ") ?? "link"}) →
            </a>
          </div>
        )}

        {/* External link */}
        {linkUrl && (
          <div className="mt-4">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
              🔗 {linkUrl}
            </a>
          </div>
        )}

        {/* Actions bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-b border-slate-100 py-3">
          <button onClick={() => handleVote(1)} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${votes.myVote === 1 ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"}`}>
            <ArrowBigUp className="h-5 w-5" /> {votes.up}
          </button>
          <button onClick={() => handleVote(-1)} className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${votes.myVote === -1 ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-50"}`}>
            <ArrowBigDown className="h-5 w-5" /> {votes.down}
          </button>
          <span className="flex items-center gap-1 px-2 text-sm text-slate-500">
            <MessageSquare className="h-4 w-4" /> {commentCount} comments
          </span>
          <button onClick={async () => { await savePost(id); setSaved(!saved); }} className={`rounded-lg p-2 transition ${saved ? "text-amber-500" : "text-slate-500 hover:bg-slate-50"}`}>
            <Bookmark className="h-5 w-5" />
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/community/post/${id}`); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50">
            <Share2 className="h-5 w-5" />
          </button>
          {isEvent && (
            <button onClick={handleRsvp} className={`ml-auto rounded-full px-4 py-2 text-sm font-semibold transition ${rsvped ? "bg-green-50 text-green-700" : "bg-brand-500 text-white hover:bg-brand-600"}`}>
              {rsvped ? "✅ Going" : "🎉 RSVP"} ({currentRsvpCount})
            </button>
          )}
        </div>

        {/* AI Suggested Answer */}
        {isQuestion && (
          <div className="mt-6">
            {aiAnswer ? (
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-purple-700"><Lightbulb className="h-4 w-4" /> AI Suggested Answer</p>
                <p className="mt-2 text-sm text-purple-800 whitespace-pre-wrap">{aiAnswer}</p>
              </div>
            ) : (
              <button onClick={handleAiSuggestion} disabled={loadingAi} className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100">
                {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}Get AI Suggestion
              </button>
            )}
          </div>
        )}

        {/* Challenge submissions */}
        {isChallenge && (
          <div className="mt-6">
            <ChallengeSubmissionForm postId={id} />
            {challengeEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold">🏆 Submissions ({challengeEntries.length})</h3>
                <div className="mt-3 space-y-3">
                  {challengeEntries.map((entry, i) => (
                    <div key={entry.id ?? i} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">{i + 1}</span>
                          <div>
                            <p className="font-semibold text-sm">{entry.title}</p>
                            <p className="text-xs text-slate-500">by {entry.profiles?.full_name ?? "Anonymous"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {entry.repo_url && <a href={entry.repo_url} target="_blank" className="text-xs font-medium text-brand-700 hover:underline">GitHub</a>}
                          {entry.live_url && <a href={entry.live_url} target="_blank" className="text-xs font-medium text-brand-700 hover:underline">Live</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Comments */}
      <div className="mt-8">
        <h2 className="text-lg font-bold">Comments ({comments.length})</h2>

        {currentUserId ? (
          <div className="mt-4">
            {replyTo && <p className="mb-2 text-xs text-slate-500">Replying to a comment · <button onClick={() => setReplyTo(null)} className="text-brand-700 underline">Cancel</button></p>}
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} className="input" rows={3} placeholder="Write a comment..." />
            <button onClick={handleComment} disabled={submitting || !commentText.trim()} className="btn-primary mt-2">{submitting ? "Posting..." : "Post Comment"}</button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Login to comment on this post.</p>
        )}

        <div className="mt-6 space-y-4">
          {comments.map((comment) => {
            const isBest = comment.is_best_answer;
            return (
              <div key={comment.id} className={`rounded-2xl border p-4 ${isBest ? "border-green-200 bg-green-50" : "border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {comment.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <Link href={`/community/members/${comment.profiles?.username ?? ""}`} className="text-sm font-semibold hover:text-brand-700">{comment.profiles?.full_name ?? "Anonymous"}</Link>
                    <span className="ml-2 text-xs text-slate-400">{getTimeAgo(comment.created_at)}</span>
                  </div>
                  {isBest && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700"><CheckCircle2 className="h-3 w-3" /> Best Answer</span>}
                </div>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => setReplyTo(comment.id)} className="text-xs font-medium text-brand-700 hover:underline">Reply</button>
                  {isQuestion && currentUserId === authorId && !isBest && (
                    <button onClick={async () => { await acceptAnswer(comment.id, id); }} className="text-xs font-medium text-green-700 hover:underline">✓ Accept Answer</button>
                  )}
                </div>
              </div>
            );
          })}
          {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet. Be the first to share your thoughts!</p>}
        </div>
      </div>
    </div>
  );
}

function ChallengeSubmissionForm({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await submitChallengeEntry(formData);
    setLoading(false);
    setOpen(false);
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-primary mt-4 inline-flex items-center gap-2"><Trophy className="h-4 w-4" />Submit Entry</button>;
  }

  return (
    <form action={handleSubmit} className="mt-4 grid gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <input type="hidden" name="post_id" value={postId} />
      <div><label className="label">Entry title *</label><input className="input mt-1" name="title" required minLength={3} placeholder="My submission" /></div>
      <div><label className="label">Description *</label><textarea className="input mt-1" name="description" required minLength={10} rows={3} placeholder="Describe your submission..." /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">GitHub repo</label><input className="input mt-1" name="repo_url" type="url" placeholder="https://github.com/..." /></div>
        <div><label className="label">Live URL</label><input className="input mt-1" name="live_url" type="url" placeholder="https://..." /></div>
      </div>
      <div className="flex gap-3">
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Entry"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
      </div>
    </form>
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
