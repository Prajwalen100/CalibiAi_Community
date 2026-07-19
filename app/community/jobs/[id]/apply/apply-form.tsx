"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { applyToJob } from "@/app/community/actions";

export function ApplyForm({
  jobId,
  defaultEmail,
  defaultPortfolio,
}: {
  jobId: string;
  defaultEmail: string;
  defaultPortfolio: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("job_id", jobId);
    const result = await applyToJob(formData);
    if ("error" in result) {
      setError(result.error ?? "Unable to submit the application.");
      setLoading(false);
      return;
    }
    router.replace(`/community/jobs/applications?submitted=1`);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="mt-6 grid gap-5 rounded-3xl border border-slate-200 p-6 sm:p-8">
      <div>
        <label className="label" htmlFor="cover_letter">Cover letter *</label>
        <textarea
          id="cover_letter"
          className="input mt-1"
          name="cover_letter"
          required
          minLength={20}
          rows={7}
          placeholder="Introduce yourself, why you're a fit, relevant experience, and a link or two you're proud of…"
        />
        <p className="mt-1 text-xs text-slate-500">Minimum 20 characters. Be specific about relevant experience.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="portfolio_url">Portfolio URL</label>
          <input id="portfolio_url" className="input mt-1" name="portfolio_url" type="url" defaultValue={defaultPortfolio} placeholder="https://yourportfolio.com" />
        </div>
        <div>
          <label className="label" htmlFor="resume_url">Resume URL</label>
          <input id="resume_url" className="input mt-1" name="resume_url" type="url" placeholder="Link to CV or Drive file" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="contact_email">Contact email *</label>
        <input id="contact_email" className="input mt-1" name="contact_email" type="email" required defaultValue={defaultEmail} placeholder="you@example.com" />
      </div>

      {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      <button className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto" type="submit" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="h-4 w-4" /> Send application</>}
      </button>
    </form>
  );
}
