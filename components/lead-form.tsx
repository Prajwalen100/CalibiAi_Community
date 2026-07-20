"use client";

import { useState } from "react";
import { registerLead } from "@/app/actions/leads";
import { ScrollReveal, StaggerReveal } from "@/components/scroll-reveal";
import { CheckCircle2, Sparkles } from "lucide-react";

export function LeadForm({ source }: { source: "workshop" | "community" | "college" | "startup" }) {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action={async (formData) => {
        setIsSubmitting(true);
        await registerLead(formData);
        setSent(true);
        setIsSubmitting(false);
      }}
      className="glass-panel p-6 space-y-4"
    >
      <input type="hidden" name="source" value={source} />
      
      <StaggerReveal staggerDelay={100} direction="up" className="space-y-4">
        <div className="space-y-1">
          <label className="label">Full name</label>
          <input className="input mt-1" required name="full_name" placeholder="Your name" autoComplete="name" />
        </div>
        <div className="space-y-1">
          <label className="label">Email</label>
          <input className="input mt-1" required type="email" name="email" placeholder="you@example.com" autoComplete="email" />
        </div>
        <div className="space-y-1">
          <label className="label">Phone</label>
          <input className="input mt-1" name="phone" placeholder="+1 (555) 000-0000" autoComplete="tel" />
        </div>
        <div className="space-y-1">
          <label className="label">College or organisation</label>
          <input className="input mt-1" name="college" placeholder="Your university or company" autoComplete="organization" />
        </div>
      </StaggerReveal>

      <div className="relative">
        <button 
          className="btn-primary w-full" 
          type="submit"
          disabled={sent || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : sent ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Saved — CalibiAI will reach out
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Register interest
            </>
          )}
        </button>
        
        {sent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      <p className="text-xs text-subtle text-center">
        By submitting, you agree to receive emails from CalibiAI. No spam, unsubscribe anytime.
      </p>
    </form>
  );
}