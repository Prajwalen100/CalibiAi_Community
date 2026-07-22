"use client";

import { useState } from "react";
import { Loader2, Building2, Globe, MapPin, Users, FileText, Image as ImageIcon } from "lucide-react";
import { completeEmployerOnboarding } from "../actions";

const SIZE_OPTIONS = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "501-1000", label: "501–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

const LOCATION_TYPES = [
  { value: "remote", label: "Fully remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site / office" },
  { value: "multi_location", label: "Multiple locations" },
  { value: "other", label: "Other" },
];

export function EmployerOnboardingForm({
  defaultEmail,
  defaultName,
}: {
  defaultEmail: string;
  defaultName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await completeEmployerOnboarding(formData);
    if (result && "error" in result) {
      setError(result.error ?? "Unable to save company profile.");
      setLoading(false);
    }
    // On success the server action redirects
  }

  return (
    <form action={handleSubmit} className="mt-8 space-y-6">
      <section className="glass-panel-strong space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-primary">Company identity</h2>
            <p className="text-sm text-secondary">Shown on every job you post.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="company_name">
              Company name *
            </label>
            <input
              id="company_name"
              className="input mt-1"
              name="company_name"
              required
              minLength={2}
              placeholder="Acme AI Labs"
              defaultValue={defaultName}
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Company email *
            </label>
            <input
              id="email"
              className="input mt-1"
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              placeholder="hiring@company.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="website">
              <span className="inline-flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Website
              </span>
            </label>
            <input
              id="website"
              className="input mt-1"
              name="website"
              type="url"
              placeholder="https://company.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="company_logo_url">
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Company logo URL
              </span>
            </label>
            <input
              id="company_logo_url"
              className="input mt-1"
              name="company_logo_url"
              type="url"
              placeholder="https://.../logo.png"
            />
            <p className="mt-1 text-xs text-subtle">
              Paste a public image URL for now. Upload support can be added later.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel-strong space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-primary">Location & size</h2>
            <p className="text-sm text-secondary">Help students know where and how you work.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="location_type">
              Location type *
            </label>
            <select id="location_type" className="input mt-1" name="location_type" defaultValue="remote" required>
              {LOCATION_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="location">
              HQ / primary location *
            </label>
            <input
              id="location"
              className="input mt-1"
              name="location"
              required
              minLength={2}
              placeholder="Bengaluru, India · or Remote"
            />
          </div>

          <div>
            <label className="label" htmlFor="company_size">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Company size *
              </span>
            </label>
            <select id="company_size" className="input mt-1" name="company_size" defaultValue="1-10" required>
              {SIZE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="pan_number">
              PAN number (India, optional)
            </label>
            <input
              id="pan_number"
              className="input mt-1 uppercase"
              name="pan_number"
              maxLength={10}
              placeholder="ABCDE1234F"
              pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
            />
          </div>
        </div>
      </section>

      <section className="glass-panel-strong space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-primary">About & contact</h2>
            <p className="text-sm text-secondary">Build trust with candidates.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sector">
              Sector / industry
            </label>
            <input id="sector" className="input mt-1" name="sector" placeholder="AI, Fintech, SaaS, EdTech…" />
          </div>
          <div>
            <label className="label" htmlFor="hiring_contact_name">
              Hiring contact name
            </label>
            <input
              id="hiring_contact_name"
              className="input mt-1"
              name="hiring_contact_name"
              placeholder="Your full name"
              defaultValue={defaultName}
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input id="phone" className="input mt-1" name="phone" type="tel" placeholder="+91 …" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="about">
              What is your company about?
            </label>
            <textarea
              id="about"
              className="input mt-1"
              name="about"
              rows={4}
              placeholder="Mission, product, team culture, what students will work on…"
            />
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button className="btn-primary w-full py-3.5 text-base" type="submit" disabled={loading}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving company profile…
          </span>
        ) : (
          "Save & open employer dashboard"
        )}
      </button>
    </form>
  );
}
