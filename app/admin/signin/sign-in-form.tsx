"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";
import { CalibiAiMark } from "@/components/calibiai-mark";

export function AdminSignInForm({
  next,
  demo,
}: {
  next: string;
  demo: { email: string; password: string } | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(demo?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Sign in failed.");
      }
      router.replace(next);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
      setBusy(false);
    }
  }

  function fillDemo() {
    if (!demo) return;
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] lg:grid-cols-[1.05fr_1fr]">
        {/* Brand side */}
        <div className="admin-glass-strong relative hidden flex-col justify-between p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#111C38] shadow-lg ring-1 ring-slate-900/10">
                <CalibiAiMark className="h-7" compact />
              </span>
              <div>
                <p className="text-lg font-black admin-title">CalibiAI</p>
                <p className="admin-eyebrow">Admin portal</p>
              </div>
            </div>

            <h1 className="mt-10 text-4xl font-black leading-tight admin-title">
              Publish blogs.
              <br />
              Export student data.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 admin-muted">
              A focused control room for the two operations that matter day to day: pushing articles to the student
              Blog tab, and downloading filtered learner records as CSV.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {[
              { title: "Blog CMS", detail: "Title, author, read time, body, image, tags and links." },
              { title: "Student export", detail: "Filter by active, inactive, college, role and score, then download CSV." },
            ].map((item) => (
              <div key={item.title} className="admin-glass-soft flex items-start gap-3 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                <div>
                  <p className="text-sm font-black admin-title">{item.title}</p>
                  <p className="text-xs leading-5 admin-muted">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form side */}
        <div className="admin-glass-strong p-7 sm:p-10">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#111C38] shadow-lg ring-1 ring-slate-900/10">
              <CalibiAiMark className="h-6" compact />
            </span>
            <div>
              <p className="font-black admin-title">CalibiAI Admin</p>
              <p className="admin-eyebrow">Sign in</p>
            </div>
          </div>

          <div className="mt-6 lg:mt-0">
            <p className="admin-eyebrow">Restricted access</p>
            <h2 className="mt-1.5 text-2xl font-black admin-title">Sign in as admin</h2>
            <p className="mt-2 text-sm admin-muted">
              Admin sessions are separate from student and employer logins.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="admin-label" htmlFor="admin-email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  className="admin-input pl-9"
                  placeholder="admin@calibiai.local"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="admin-label" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="admin-input pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-300/50 bg-rose-50/80 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" disabled={busy} className="admin-btn admin-btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {busy ? "Signing in…" : "Sign in to admin"}
            </button>
          </form>

          {demo ? (
            <div className="admin-glass-soft mt-6 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="admin-eyebrow">Testing credentials</p>
                <button type="button" onClick={fillDemo} className="admin-btn admin-btn-ghost admin-btn-sm">
                  Autofill
                </button>
              </div>
              <p className="admin-mono mt-2 text-xs admin-muted">{demo.email}</p>
              <p className="admin-mono text-xs admin-muted">{demo.password}</p>
              <p className="mt-2 text-[11px] leading-5 admin-faint">
                Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment to replace these defaults.
              </p>
            </div>
          ) : null}

          <p className="mt-6 text-xs admin-faint">
            Looking for the student login?{" "}
            <Link href="/signin" className="font-bold text-sky-600 hover:text-sky-700">
              Go to /signin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
