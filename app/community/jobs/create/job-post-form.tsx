"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createJobPosting } from "@/app/community/actions";

export function JobPostForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await createJobPosting(formData);
    if ("error" in result) {
      setError(result.error ?? "Unable to publish this job posting. Please try again.");
      setLoading(false);
      return;
    }

    router.replace(`/community/jobs/${result.id}`);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <Link
        href="/community/jobs"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <form action={handleSubmit} className="mt-6 grid gap-6 rounded-3xl border border-slate-200 p-6 sm:p-8">
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <h2 className="font-bold text-brand-900">Structured job posting</h2>
          <p className="mt-1 text-sm text-brand-800">
            Job opportunities are kept separate from community discussions. Fields marked with an asterisk are shown to candidates.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">Job title *</label>
            <input id="title" className="input mt-1" name="title" required minLength={3} placeholder="e.g. Junior AI Engineer" />
          </div>
          <div>
            <label className="label" htmlFor="company_name">Company name *</label>
            <input id="company_name" className="input mt-1" name="company_name" required minLength={2} placeholder="Company or organization" />
          </div>
          <div>
            <label className="label" htmlFor="company_website">Company website</label>
            <input id="company_website" className="input mt-1" name="company_website" type="url" placeholder="https://company.com" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">Job description *</label>
          <textarea
            id="description"
            className="input mt-1"
            name="description"
            required
            minLength={20}
            rows={7}
            placeholder="Describe the role, responsibilities, team, and what the successful candidate will work on..."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="employment_type">Employment type *</label>
            <select id="employment_type" className="input mt-1" name="employment_type" defaultValue="full_time">
              <option value="internship">Internship</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="workplace_type">Workplace *</label>
            <select id="workplace_type" className="input mt-1" name="workplace_type" defaultValue="remote">
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="location">Location *</label>
            <input id="location" className="input mt-1" name="location" required minLength={2} placeholder="Remote or city, country" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="skills_required">Skills required *</label>
            <input id="skills_required" className="input mt-1" name="skills_required" required placeholder="Python, LangChain, AWS (comma separated)" />
            <p className="mt-1 text-xs text-slate-500">Separate each skill with a comma.</p>
          </div>
          <div>
            <label className="label" htmlFor="experience_required">Experience required *</label>
            <input id="experience_required" className="input mt-1" name="experience_required" required placeholder="e.g. 0–2 years or final-year students" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="compensation">Compensation *</label>
            <input id="compensation" className="input mt-1" name="compensation" required placeholder="e.g. ₹8–12 LPA, $25/hour, or stipend details" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="contact_email">Email to reach out *</label>
            <input id="contact_email" className="input mt-1" name="contact_email" type="email" required placeholder="hiring@company.com" />
          </div>
          <div>
            <label className="label" htmlFor="application_url">Application URL</label>
            <input id="application_url" className="input mt-1" name="application_url" type="url" placeholder="https://company.com/careers/..." />
          </div>
          <div>
            <label className="label" htmlFor="application_deadline">Application deadline</label>
            <input id="application_deadline" className="input mt-1" name="application_deadline" type="datetime-local" />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
        )}

        <button className="btn-primary w-full sm:w-auto" type="submit" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Publishing job…</span>
          ) : "Publish Job Posting"}
        </button>
      </form>
    </div>
  );
}
