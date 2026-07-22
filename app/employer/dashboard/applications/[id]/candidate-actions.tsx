"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateEmployerApplicationStatus } from "@/app/employer/actions";

const statuses: Array<{
  value: "submitted" | "shortlisted" | "interviewed" | "accepted" | "rejected";
  label: string;
}> = [
  { value: "submitted", label: "Submitted" },
  { value: "shortlisted", label: "Shortlist" },
  { value: "interviewed", label: "Interview" },
  { value: "accepted", label: "Accept" },
  { value: "rejected", label: "Reject" },
];

export function CandidateActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(status: (typeof statuses)[number]["value"]) {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployerApplicationStatus(applicationId, status);
      if ("error" in result) setError(result.error ?? "Unable to update");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {statuses.map((s) => (
        <button
          key={s.value}
          type="button"
          disabled={pending || currentStatus === s.value}
          onClick={() => update(s.value)}
          className={`flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
            currentStatus === s.value
              ? "bg-ink text-white"
              : "border border-slate-200 bg-white text-secondary hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950"
          } disabled:opacity-60`}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : s.label}
        </button>
      ))}
    </div>
  );
}
