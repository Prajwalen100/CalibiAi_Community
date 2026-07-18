"use client";

import { useState } from "react";
import Link from "next/link";
import { createPost } from "@/app/community/actions";
import { Loader2, ArrowLeft } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
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
              onClick={() => setPostType(t.key)}
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

      <form action={handleSubmit} className="mt-6 grid gap-5 rounded-3xl border border-slate-200 p-6">
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
    </div>
  );
}
