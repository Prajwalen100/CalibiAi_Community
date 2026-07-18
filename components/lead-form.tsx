"use client";

import { useState } from "react";
import { registerLead } from "@/app/actions/leads";

export function LeadForm({ source }: { source: "workshop" | "community" | "college" | "startup" }) {
  const [sent, setSent] = useState(false);
  return (
    <form
      action={async (formData) => {
        await registerLead(formData);
        setSent(true);
      }}
      className="card grid gap-4"
    >
      <input type="hidden" name="source" value={source} />
      <div><label className="label">Full name</label><input className="input mt-1" required name="full_name" /></div>
      <div><label className="label">Email</label><input className="input mt-1" required type="email" name="email" /></div>
      <div><label className="label">Phone</label><input className="input mt-1" name="phone" /></div>
      <div><label className="label">College or organisation</label><input className="input mt-1" name="college" /></div>
      <button className="btn-primary" type="submit">{sent ? "Saved — CalibiAI will reach out" : "Register interest"}</button>
    </form>
  );
}
