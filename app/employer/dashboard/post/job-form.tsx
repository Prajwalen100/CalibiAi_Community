"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createEmployerJob } from "@/app/employer/actions";

export function EmployerJobForm({
  defaultEmail,
  defaultLocation,
  defaultWebsite,
  defaultCategory = "job",
}: {
  defaultEmail: string;
  defaultLocation: string;
  defaultWebsite: string;
  defaultCategory?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGig = defaultCategory === "freelance";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (!formData.get("category")) {
      formData.set("category", isGig ? "freelance" : "job");
    }
    const result = await createEmployerJob(formData);
    if ("error" in result) {
      setError(result.error ?? "Unable to publish.");
      setLoading(false);
      return;
    }
    router.replace(`/employer/dashboard/jobs?posted=1`);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="mt-6 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-900/40 dark:bg-brand-950/30">
        <h2 className="font-bold text-brand-900 dark:text-brand-100">
          {isGig ? "Freelance gig posting" : "Job / opportunity posting"}
        </h2>
        <p className="mt-1 text-sm text-brand-800 dark:text-brand-200">
          Company details are filled from your employer profile. This listing will appear on the student Jobs and
          Opportunity pages immediately after publish.
        </p>
      </div>

      <input type="hidden" name="category" value={isGig ? "freelance" : "job"} />

      <div>
        <label className="label" htmlFor="title">
          {isGig ? "Gig title *" : "Job title *"}
        </label>
        <input
          id="title"
          className="input mt-1"
          name="title"
          required
          minLength={3}
          placeholder={isGig ? "e.g. Build a support chatbot" : "e.g. Junior AI Engineer"}
        />
      </div>

      <div>
        <label className="label" htmlFor="description">
          Description *
        </label>
        <textarea
          id="description"
          className="input mt-1"
          name="description"
          required
          minLength={20}
          rows={7}
          placeholder="Describe the role, responsibilities, deliverables, and what success looks like…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="employment_type">
            Type *
          </label>
          <select
            id="employment_type"
            className="input mt-1"
            name="employment_type"
            defaultValue={isGig ? "freelance" : "full_time"}
          >
            <option value="internship">Internship</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="workplace_type">
            Workplace *
          </label>
          <select id="workplace_type" className="input mt-1" name="workplace_type" defaultValue="remote">
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on_site">On-site</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="location">
            Location *
          </label>
          <input
            id="location"
            className="input mt-1"
            name="location"
            required
            defaultValue={defaultLocation}
            placeholder="Remote or city, country"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="skills_required">
            Skills required *
          </label>
          <input
            id="skills_required"
            className="input mt-1"
            name="skills_required"
            required
            placeholder="Python, LangChain, AWS (comma separated)"
          />
        </div>
        <div>
          <label className="label" htmlFor="experience_required">
            Experience required *
          </label>
          <input
            id="experience_required"
            className="input mt-1"
            name="experience_required"
            required
            placeholder="e.g. 0–2 years or final-year students"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="compensation">
            Compensation *
          </label>
          <input
            id="compensation"
            className="input mt-1"
            name="compensation"
            required
            placeholder="e.g. ₹8–12 LPA, $25/hour, or stipend details"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact_email">
            Contact email *
          </label>
          <input
            id="contact_email"
            className="input mt-1"
            name="contact_email"
            type="email"
            required
            defaultValue={defaultEmail}
          />
        </div>
        <div>
          <label className="label" htmlFor="company_website">
            Company website
          </label>
          <input
            id="company_website"
            className="input mt-1"
            name="company_website"
            type="url"
            defaultValue={defaultWebsite}
            placeholder="https://company.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="application_url">
            External application URL
          </label>
          <input id="application_url" className="input mt-1" name="application_url" type="url" placeholder="Optional" />
        </div>
        <div>
          <label className="label" htmlFor="application_deadline">
            Application deadline
          </label>
          <input id="application_deadline" className="input mt-1" name="application_deadline" type="datetime-local" />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button className="btn-primary w-full sm:w-auto" type="submit" disabled={loading}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
          </span>
        ) : (
          "Publish posting"
        )}
      </button>
    </form>
  );
}
