"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateEmployerCompany } from "@/app/employer/actions";

type Employer = {
  company_name: string;
  company_logo_url: string | null;
  email: string;
  website: string | null;
  location: string | null;
  location_type: string;
  company_size: string;
  pan_number: string | null;
  about: string | null;
  sector: string | null;
  hiring_contact_name: string | null;
  phone: string | null;
};

export function CompanyEditForm({ employer }: { employer: Employer }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setOk(false);
    const result = await updateEmployerCompany(formData);
    if (result && "error" in result) {
      setError(result.error ?? "Unable to save");
      setLoading(false);
      return;
    }
    setOk(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="mt-6 grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Company name *</label>
          <input className="input mt-1" name="company_name" required defaultValue={employer.company_name} />
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="input mt-1" name="email" type="email" required defaultValue={employer.email} />
        </div>
        <div>
          <label className="label">Website</label>
          <input className="input mt-1" name="website" type="url" defaultValue={employer.website ?? ""} />
        </div>
        <div>
          <label className="label">Logo URL</label>
          <input className="input mt-1" name="company_logo_url" type="url" defaultValue={employer.company_logo_url ?? ""} />
        </div>
        <div>
          <label className="label">Location type *</label>
          <select className="input mt-1" name="location_type" defaultValue={employer.location_type}>
            <option value="remote">Fully remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on_site">On-site</option>
            <option value="multi_location">Multiple locations</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Location *</label>
          <input className="input mt-1" name="location" required defaultValue={employer.location ?? ""} />
        </div>
        <div>
          <label className="label">Company size *</label>
          <select className="input mt-1" name="company_size" defaultValue={employer.company_size}>
            <option value="1-10">1–10</option>
            <option value="11-50">11–50</option>
            <option value="51-200">51–200</option>
            <option value="201-500">201–500</option>
            <option value="501-1000">501–1,000</option>
            <option value="1000+">1,000+</option>
          </select>
        </div>
        <div>
          <label className="label">PAN</label>
          <input className="input mt-1 uppercase" name="pan_number" defaultValue={employer.pan_number ?? ""} maxLength={10} />
        </div>
        <div>
          <label className="label">Sector</label>
          <input className="input mt-1" name="sector" defaultValue={employer.sector ?? ""} />
        </div>
        <div>
          <label className="label">Hiring contact</label>
          <input className="input mt-1" name="hiring_contact_name" defaultValue={employer.hiring_contact_name ?? ""} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input mt-1" name="phone" defaultValue={employer.phone ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">About</label>
          <textarea className="input mt-1" name="about" rows={4} defaultValue={employer.about ?? ""} />
        </div>
      </div>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {ok && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Company profile updated.</p>}

      <button className="btn-primary w-full sm:w-auto" type="submit" disabled={loading}>
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </span>
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}
