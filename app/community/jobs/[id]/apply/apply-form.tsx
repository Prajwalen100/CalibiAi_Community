"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Upload, FileText } from "lucide-react";
import { applyToJob } from "@/app/community/actions";

export function ApplyForm({
  jobId,
  defaultEmail,
  defaultPortfolio,
}: {
  jobId: string;
  defaultEmail: string;
  defaultPortfolio: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    // Handle resume file upload (store as base64 or send to storage later)
    if (resumeFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        formData.set("resume_file", reader.result as string);
        formData.set("resume_filename", resumeFile.name);
        formData.set("job_id", jobId);
        const result = await applyToJob(formData);
        if ("error" in result) {
          setError(result.error ?? "Unable to submit the application.");
          setLoading(false);
          return;
        }
        router.replace(`/community/jobs/applications?submitted=1`);
        router.refresh();
      };
      reader.readAsDataURL(resumeFile);
    } else {
      formData.set("job_id", jobId);
      const result = await applyToJob(formData);
      if ("error" in result) {
        setError(result.error ?? "Unable to submit the application.");
        setLoading(false);
        return;
      }
      router.replace(`/community/jobs/applications?submitted=1`);
      router.refresh();
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Please upload PDF, DOC, DOCX, JPG or JPEG only.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File must be under 5MB.");
        return;
      }
      setResumeFile(file);
      setError(null);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Cover Letter */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Cover letter *</label>
        <textarea
          name="cover_letter"
          required
          minLength={20}
          rows={8}
          className="w-full resize-y rounded-2xl border border-white/60 bg-white/70 px-5 py-4 text-sm shadow-inner backdrop-blur placeholder:text-slate-400 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          placeholder="Introduce yourself, why you're a fit, relevant experience, and a link or two you're proud of…"
        />
        <p className="mt-1.5 text-xs text-slate-500">Minimum 20 characters. Be specific about relevant experience.</p>
      </div>

      {/* Portfolio + Resume URL */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Portfolio URL</label>
          <input
            name="portfolio_url"
            type="url"
            defaultValue={defaultPortfolio}
            placeholder="https://yourportfolio.com"
            className="w-full rounded-2xl border border-white/60 bg-white/70 px-5 py-3 text-sm shadow-inner backdrop-blur placeholder:text-slate-400 focus:border-brand-400"
          />
        </div>

        {/* Beautiful Resume Upload */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Resume / CV</label>
          <label className="group relative flex h-[52px] cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-white/70 bg-white/60 px-6 text-sm font-medium text-slate-600 shadow-inner backdrop-blur transition hover:border-brand-400 hover:bg-white/80">
            <Upload className="h-4 w-4 text-brand-600 group-hover:scale-110 transition" />
            {resumeFile ? (
              <span className="flex items-center gap-2 text-emerald-600">
                <FileText className="h-4 w-4" /> {resumeFile.name}
              </span>
            ) : (
              "Upload PDF, DOC, JPG (max 5MB)"
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg"
              onChange={handleFileChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <p className="mt-1 text-[10px] text-slate-500">Supported: PDF, Word, JPG, JPEG</p>
        </div>
      </div>

      {/* Contact Email */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Contact email *</label>
        <input
          name="contact_email"
          type="email"
          required
          defaultValue={defaultEmail}
          className="w-full rounded-2xl border border-white/60 bg-white/70 px-5 py-3 text-sm shadow-inner backdrop-blur placeholder:text-slate-400 focus:border-brand-400"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white shadow-xl transition active:scale-[0.985] disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting application…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Send application
          </>
        )}
      </button>
    </form>
  );
}
