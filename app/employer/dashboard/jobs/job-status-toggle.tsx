"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateJobStatus } from "@/app/employer/actions";

export function JobStatusToggle({
  jobId,
  status,
}: {
  jobId: string;
  status: "open" | "closed";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const next = status === "open" ? "closed" : "open";
      const result = await updateJobStatus(jobId, next);
      if ("error" in result) setError(result.error ?? "Failed");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-secondary hover:border-brand-400 hover:text-brand-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === "open" ? "Close posting" : "Reopen"}
      </button>
      {error && <span className="text-[10px] text-rose-600">{error}</span>}
    </div>
  );
}
