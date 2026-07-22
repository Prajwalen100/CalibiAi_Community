"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { sendJobOffer } from "@/app/employer/actions";

export function OfferForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("application_id", applicationId);
    const result = await sendJobOffer(formData);
    if ("error" in result) {
      setError(result.error ?? "Unable to send offer");
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    router.refresh();
  }

  if (done) {
    return (
      <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
        Offer sent. The candidate has been notified.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="mt-3 space-y-3">
      <textarea
        name="message"
        className="input"
        required
        minLength={10}
        rows={4}
        placeholder="Offer details, start date expectations, next steps…"
      />
      <input
        name="compensation"
        className="input"
        placeholder="Compensation (optional)"
      />
      <input name="start_date" className="input" type="date" />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <button type="submit" className="btn-primary w-full py-2.5 text-xs" disabled={loading}>
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Send className="h-3.5 w-3.5" /> Send offer
          </span>
        )}
      </button>
    </form>
  );
}
