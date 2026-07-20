"use client";

import { useState } from "react";
import Link from "next/link";
import { createPost } from "@/app/community/actions";
import { Loader2, ArrowLeft, Bot, Users, Sparkles, RefreshCw, MessageSquarePlus } from "lucide-react";

const postTypes = [
  { key: "discussion", label: "💬 Discussion", desc: "Start a conversation" },
  { key: "question", label: "❓ Question", desc: "Ask the community" },
  { key: "showcase", label: "🚀 Showcase", desc: "Share your project" },
  { key: "tutorial", label: "📚 Tutorial", desc: "Teach something" },
  { key: "research", label: "📄 Research", desc: "Share a paper or finding" },
  { key: "career", label: "💼 Career", desc: "Career advice or experience" },
  { key: "challenge", label: "🏆 Challenge", desc: "Launch a challenge" },
  { key: "team_finder", label: "🔍 Team Finder", desc: "Find teammates" },
  { key: "resource", label: "📎 Resource", desc: "Share a useful resource" },
  { key: "event", label: "📅 Event", desc: "Announce an event" },
  { key: "meme", label: "😂 Meme", desc: "Share AI humor" },
];

type Props = {
  communities: Array<{ id: string; name: string; emoji: string; slug: string }>;
  defaultType?: string;
  defaultCommunity?: string;
};

export function CreatePostForm({ communities, defaultType, defaultCommunity }: Props) {
  const [postType, setPostType] = useState(defaultType || "discussion");
  const [questionSubMode, setQuestionSubMode] = useState<"choice" | "community" | "ai">(
    defaultType === "question" ? "choice" : "community"
  );

  // Community form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionContent, setQuestionContent] = useState("");

  // Ask AI states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  function handleSelectPostType(typeKey: string) {
    setPostType(typeKey);
    if (typeKey === "question") {
      setQuestionSubMode("choice");
    } else {
      setQuestionSubMode("community");
    }
  }

  async function handleSubmitCommunity(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);
    formData.set("post_type", postType);
    const result = await createPost(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  async function handleAskAi(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch("/api/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiError(data.error || "Failed to get AI answer.");
      } else {
        setAiResponse(data.answer);
      }
    } catch {
      setAiError("Network error while reaching AI assistant.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleTransferAiToCommunity() {
    setQuestionTitle(aiPrompt.slice(0, 80));
    setQuestionContent(aiPrompt + (aiResponse ? `\n\n--- AI Initial Response ---\n${aiResponse}` : ""));
    setQuestionSubMode("community");
  }

  const selectedType = postTypes.find((t) => t.key === postType);

  return (
    <div className="mt-6">
      <Link href="/community" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Community
      </Link>

      {/* Post Type Selector */}
      <div className="mt-6">
        <label className="label">What are you posting?</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {postTypes.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleSelectPostType(t.key)}
              className={`rounded-xl border p-3 text-left transition ${
                postType === t.key ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-bold">{t.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* QUESTION CHOICE SCREEN */}
      {postType === "question" && questionSubMode === "choice" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-2xl text-brand-700 font-bold">
              ❓
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">How would you like to ask your question?</h2>
              <p className="text-sm text-slate-600">Choose between asking the human community or getting an instant AI response.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {/* Option 1: Post to Community */}
            <button
              type="button"
              onClick={() => setQuestionSubMode("community")}
              className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 p-6 text-left transition-all hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-md"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-black text-slate-900 group-hover:text-brand-700">
                  Post to Community
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Publish your question to the CalibiAI public feed for peer answers, discussion, and feedback from student engineers & mentors.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-brand-700 group-hover:underline">
                Ask Community Peers →
              </div>
            </button>

            {/* Option 2: ASK to AI */}
            <button
              type="button"
              onClick={() => setQuestionSubMode("ai")}
              className="group flex flex-col justify-between rounded-2xl border-2 border-purple-200 bg-purple-50/30 p-6 text-left transition-all hover:border-purple-500 hover:bg-purple-50/70 hover:shadow-md"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-black text-slate-900 group-hover:text-purple-700">
                  ASK to AI
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Get an immediate, intelligent answer from CalibiAI Assistant powered by Amazon Bedrock right now without waiting for replies.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-purple-700 group-hover:underline">
                Get Instant AI Answer →
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ASK TO AI INTERACTIVE MODE */}
      {postType === "question" && questionSubMode === "ai" && (
        <div className="mt-6 rounded-3xl border border-purple-200 bg-purple-50/20 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-purple-950">Asking CalibiAI Assistant</h2>
                <p className="text-xs text-purple-700">Powered by Amazon Bedrock AI</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setQuestionSubMode("choice")}
              className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50"
            >
              ← Switch Options (Post to Community)
            </button>
          </div>

          <form onSubmit={handleAskAi} className="mt-5 space-y-4">
            <div>
              <label className="label text-purple-900">Your AI Prompt / Question *</label>
              <textarea
                className="input mt-1 border-purple-200 focus:border-purple-500 focus:ring-purple-200"
                rows={4}
                required
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask anything about code, architecture, RAG, machine learning, or career advice..."
              />
            </div>

            <button
              type="submit"
              disabled={aiLoading || !aiPrompt.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> ASK to AI
                </>
              )}
            </button>
          </form>

          {aiError && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {aiError}
            </p>
          )}

          {aiResponse && (
            <div className="mt-6 rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                <Sparkles className="h-4 w-4 text-purple-600" /> CalibiAI Assistant Response
              </div>
              <div className="mt-3 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
                {aiResponse}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleTransferAiToCommunity}
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100"
                >
                  <MessageSquarePlus className="h-4 w-4" /> Want community opinions too? Post to Feed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiResponse(null);
                    setAiPrompt("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Ask Another Question
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STANDARD COMMUNITY COMPOSER FORM (used for all non-question posts, and for question posts when Community option is chosen) */}
      {(postType !== "question" || questionSubMode === "community") && (
        <form action={handleSubmitCommunity} className="mt-6 grid gap-5 rounded-3xl border border-slate-200 p-6">
          {postType === "question" && (
            <div className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50/50 p-3 text-xs">
              <span className="font-bold text-brand-800">👥 Posting Question to Community Feed</span>
              <button
                type="button"
                onClick={() => setQuestionSubMode("choice")}
                className="font-bold text-brand-700 underline hover:text-brand-900"
              >
                Change Choice (ASK to AI)
              </button>
            </div>
          )}

          {/* Community */}
          {communities.length > 0 && (
            <div>
              <label className="label">Community (optional)</label>
              <select className="input mt-1" name="community_id" defaultValue={defaultCommunity || ""}>
                <option value="">Select a community...</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              className="input mt-1"
              name="title"
              required
              minLength={3}
              value={questionTitle || undefined}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder={
                postType === "question" ? "What's your question?" :
                postType === "showcase" ? "Project name" :
                postType === "challenge" ? "Challenge title" :
                "Give your post a title"
              }
            />
          </div>

          {/* Content */}
          <div>
            <label className="label">Content *</label>
            <textarea
              className="input mt-1"
              name="content"
              required
              rows={6}
              value={questionContent || undefined}
              onChange={(e) => setQuestionContent(e.target.value)}
              placeholder={
                postType === "question" ? "Describe your question in detail. Include error messages, code snippets, or what you've tried..." :
                postType === "showcase" ? "Describe your project — what it does, how you built it, and what you learned..." :
                postType === "tutorial" ? "Write your tutorial step by step. Include code examples and explanations..." :
                postType === "challenge" ? "Describe the challenge, rules, judging criteria, and deadline..." :
                "Share your thoughts, ideas, or findings..."
              }
            />
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input mt-1" name="tags" placeholder="e.g. python, rag, langchain" />
          </div>

          {/* Link */}
          <div>
            <label className="label">Link URL (optional)</label>
            <input className="input mt-1" name="link_url" type="url" placeholder="https://..." />
          </div>

          {/* Showcase-specific fields */}
          {(postType === "showcase" || postType === "challenge") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">GitHub repo URL</label>
                <input className="input mt-1" name="repo_url" type="url" placeholder="https://github.com/..." />
              </div>
              <div>
                <label className="label">Live demo URL</label>
                <input className="input mt-1" name="live_url" type="url" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Demo video URL</label>
                <input className="input mt-1" name="demo_video_url" type="url" placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label className="label">Tech stack</label>
                <input className="input mt-1" name="tech_stack" placeholder="Next.js, Python, LangChain" />
              </div>
            </div>
          )}

          {/* Challenge deadline */}
          {postType === "challenge" && (
            <div>
              <label className="label">Challenge deadline</label>
              <input className="input mt-1" name="challenge_deadline" type="datetime-local" />
            </div>
          )}

          {/* Event-specific fields */}
          {postType === "event" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Event date</label>
                <input className="input mt-1" name="event_date" type="datetime-local" />
              </div>
              <div>
                <label className="label">Event type</label>
                <select className="input mt-1" name="event_type">
                  <option value="workshop">Workshop</option>
                  <option value="webinar">Webinar</option>
                  <option value="meetup">Meetup</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="ama">Live AMA</option>
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input mt-1" name="event_location" placeholder="Online / Venue" />
              </div>
            </div>
          )}

          {/* Resource-specific fields */}
          {postType === "resource" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Resource type</label>
                <select className="input mt-1" name="resource_type">
                  <option value="pdf">PDF</option>
                  <option value="cheatsheet">Cheat Sheet</option>
                  <option value="prompt_library">Prompt Library</option>
                  <option value="workflow">AI Workflow</option>
                  <option value="template">Template</option>
                  <option value="opensource">Open-Source Tool</option>
                </select>
              </div>
              <div>
                <label className="label">Resource URL</label>
                <input className="input mt-1" name="resource_url" type="url" placeholder="https://..." />
              </div>
            </div>
          )}

          {/* Image */}
          <div>
            <label className="label">Image URL (optional)</label>
            <input className="input mt-1" name="image_url" type="url" placeholder="https://..." />
          </div>

          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
          )}

          {success && (
            <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              ✅ Post created successfully! <Link href="/community" className="font-semibold underline">View in feed →</Link>
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Posting...
              </span>
            ) : (
              `Post ${selectedType?.label ?? ""}`
            )}
          </button>
        </form>
      )}
    </div>
  );
}
