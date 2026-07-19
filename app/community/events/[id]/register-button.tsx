"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, CalendarPlus } from "lucide-react";
import { toggleEventRegistration } from "@/app/community/actions";

export function RegisterButton({ eventId, isRegistered, disabled }: { eventId: string; isRegistered: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleEventRegistration(eventId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={pending || disabled}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isRegistered ? "border border-green-300 bg-white text-green-700 hover:bg-green-50" : "bg-ink text-white shadow-soft hover:bg-slate-800"}`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" />
          : isRegistered ? <><CheckCircle2 className="h-4 w-4" /> You&apos;re registered · Cancel</>
          : <><CalendarPlus className="h-4 w-4" /> Register for event</>}
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-rose-700">{error}</p>}
    </>
  );
}
