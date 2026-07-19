"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ExternalLink } from "lucide-react";
import { updateApplicationStatus } from "@/app/community/actions";

type ApplicationRow = {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string;
  portfolio_url: string | null;
  resume_url: string | null;
  contact_email: string;
  status: string;
  created_at: string;
  applicant: { user_id: string; full_name: string | null; username: string | null; target_role: string | null } | null;
};

const statuses: Array<{ value: "submitted" | "shortlisted" | "interviewed" | "accepted" | "rejected"; label: string; color: string }> = [
  { value: "submitted", label: "Submitted", color: "bg-slate-100 text-slate-700" },
  { value: "shortlisted", label: "Shortlist", color: "bg-amber-50 text-amber-800" },
  { value: "interviewed", label: "Interview", color: "bg-indigo-50 text-indigo-800" },
  { value: "accepted", label: "Accept", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Reject", color: "bg-rose-50 text-rose-700" },
];

export function ApplicationsList({ applications, jobTitle }: { applications: ApplicationRow[]; jobTitle: string }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(applicationId: string, status: "submitted" | "shortlisted" | "interviewed" | "accepted" | "rejected") {
    setPendingId(applicationId);
    setError(null);
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, status);
      if ("error" in result) setError(result.error ?? "Unable to update status.");
      setPendingId(null);
      router.refresh();
    });
  }

  if (applications.length === 0) {
    return <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No applications yet.</p>;
  }

  return (
    <div className="mt-5 space-y-4">
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {applications.map((a) => (
        <div key={a.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold">
                {a.applicant?.username ? (
                  <Link href={`/community/members/${a.applicant.username}`} className="hover:text-brand-700">
                    {a.applicant.full_name || `@${a.applicant.username}`}
                  </Link>
                ) : (
                  a.applicant?.full_name || "Applicant"
                )}
              </p>
              <p className="text-xs text-slate-500">
                {a.applicant?.username ? `@${a.applicant.username}` : "no username"}
                {a.applicant?.target_role ? ` · ${a.applicant.target_role}` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">Applied {new Date(a.created_at).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statuses.find((s) => s.value === a.status)?.color ?? "bg-slate-100 text-slate-700"}`}>
              {a.status.replace(/_/g, " ")}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-slate-700">{a.cover_letter}</p>

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a href={`mailto:${a.contact_email}?subject=${encodeURIComponent(`Re: your application for ${jobTitle}`)}`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
              <Mail className="h-4 w-4" /> {a.contact_email}
            </a>
            {a.portfolio_url && (
              <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:underline">
                Portfolio <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {a.resume_url && (
              <a href={a.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:underline">
                Resume <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => update(a.id, s.value)}
                disabled={pendingId === a.id || a.status === s.value}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${a.status === s.value ? "bg-ink text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700"} disabled:opacity-60`}
              >
                {pendingId === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
