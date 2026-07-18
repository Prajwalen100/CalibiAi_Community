"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitProject } from "./actions";
import { Loader2 } from "lucide-react";

export function SubmitProjectForm({
  moduleId,
  moduleTitle,
  buildTask,
}: {
  moduleId?: string;
  moduleTitle?: string;
  buildTask?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await submitProject(formData) as { error?: string } | void;
      // If we get here, the server action returned a result (error) instead of redirecting
      if (result && "error" in result && result.error) {
        setError(result.error);
        setLoading(false);
      }
      // If redirect happened, the page will navigate away automatically
    } catch (err: unknown) {
      // Next.js server action redirect throws NEXT_REDIRECT error
      // This is expected behavior — just let the router handle it
      if (err instanceof Error && (err.message.includes("NEXT_REDIRECT") || err.message === "NEXT_REDIRECT")) {
        // Redirect is happening, navigate to dashboard
        router.push("/dashboard?submitted=1");
        return;
      }
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="mt-8 grid gap-5 rounded-3xl border border-slate-200 p-6">
      <input type="hidden" name="module_id" value={moduleId || ""} />

      {/* Project Name */}
      <div>
        <label className="label">Project name *</label>
        <input
          className="input mt-1"
          name="title"
          required
          minLength={3}
          placeholder="e.g. AI-Powered Resume Analyzer"
        />
      </div>

      {/* Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">GitHub repo URL</label>
          <input
            className="input mt-1"
            name="repo_url"
            type="url"
            placeholder="https://github.com/you/project"
          />
        </div>
        <div>
          <label className="label">Live demo URL</label>
          <input
            className="input mt-1"
            name="live_url"
            type="url"
            placeholder="https://your-project.vercel.app"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label">Project description *</label>
        <textarea
          className="input mt-1"
          name="description"
          required
          minLength={20}
          rows={4}
          placeholder="Describe what your project does, the problem it solves, and who it's for."
          defaultValue={buildTask ? `Building on the task: ${buildTask}` : ""}
        />
      </div>

      {/* How it works */}
      <div>
        <label className="label">How it works *</label>
        <textarea
          className="input mt-1"
          name="how_it_works"
          required
          minLength={20}
          rows={5}
          placeholder="Explain the architecture, key components, data flow, and how AI/ML is used. Be specific about what you built vs what used existing APIs for."
        />
      </div>

      {/* Tech stack */}
      <div>
        <label className="label">Tech stack</label>
        <input
          className="input mt-1"
          name="tech_stack"
          placeholder="e.g. Next.js, Python, LangChain, OpenAI API, Supabase"
        />
      </div>

      {/* AI Review notice */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-ink">AI-Powered Review</p>
        <p className="mt-1">
          After submission, Amazon Bedrock will review your project for completeness, technical depth,
          and originality. A verified score (0–100) will be assigned and added to your CalibiAI profile.
          Projects scoring 50+ are automatically marked as verified.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">Submission failed</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs text-rose-600">If the error mentions missing columns, please run the database migration: <code>supabase/migrations/002_community.sql</code></p>
        </div>
      )}

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting for AI review…
          </span>
        ) : (
          "Submit for AI review"
        )}
      </button>
    </form>
  );
}
