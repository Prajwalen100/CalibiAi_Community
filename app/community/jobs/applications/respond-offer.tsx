"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { respondToJobOffer } from "@/app/community/actions";

export function RespondToOffer({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function respond(status: "accepted" | "declined") {
    setError(null);
    startTransition(async () => {
      const result = await respondToJobOffer(offerId, status);
      if ("error" in result) setError(result.error ?? "Unable to respond");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {error && <p className="w-full text-xs text-rose-600">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => respond("accepted")}
        className="btn-primary py-2 text-xs"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept offer"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => respond("declined")}
        className="btn-secondary py-2 text-xs"
      >
        Decline
      </button>
    </div>
  );
}
