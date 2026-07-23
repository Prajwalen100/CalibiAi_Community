"use client";

import { createBrowserClient } from "@supabase/ssr";
import { AuthComponent, type OAuthProvider } from "@/components/ui/sign-up";
import { BrandLogo, AnimatedBrandLogo } from "@/components/brand-logo";
import { ScrollReveal, Floating, GlowOnHover } from "@/components/scroll-reveal";
import { Building2, Briefcase, ShieldCheck, Users, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

export function EmployerSignInClient({ mode }: { mode: "sign-up" | "sign-in" }) {
  async function handleOAuth(provider: OAuthProvider) {
    const supabase = getSupabase();
    if (!supabase) {
      alert("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    try {
      document.cookie = `calibiai_auth_intent=employer; path=/; max-age=600; samesite=lax`;
    } catch {
      /* ignore */
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?intent=employer`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  async function handleEmailSubmit({
    email,
    password,
    mode,
  }: {
    email: string;
    password: string;
    mode: "sign-up" | "sign-in";
  }): Promise<string | void> {
    const supabase = getSupabase();
    if (!supabase) {
      return "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
    }

    try {
      document.cookie = `calibiai_auth_intent=employer; path=/; max-age=600; samesite=lax`;
    } catch {
      /* ignore */
    }

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?intent=employer`,
          data: { account_type: "employer" },
        },
      });
      if (error) return error.message;
      if (!data.session) {
        return "Check your inbox — we sent you a confirmation link to finish signing up as an employer.";
      }
      window.location.assign("/employer/onboarding");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    window.location.assign("/api/auth/callback?intent=employer");
    return;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-brand-500/10 to-cyan-500/10 blur-[180px] animate-float-slow dark:from-indigo-500/20 dark:via-brand-500/10 dark:to-cyan-500/15"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-500/10 via-indigo-500/8 to-purple-500/10 blur-[150px] animate-float-slow dark:from-brand-500/10 dark:via-indigo-500/10 dark:to-purple-500/15"
          style={{ animationDuration: "15s", animationDelay: "2s" }}
        />
        <div
          className="absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-brand-500/8 via-cyan-500/5 to-indigo-500/8 blur-[120px] dark:from-brand-500/10 dark:via-cyan-500/8 dark:to-indigo-500/10"
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="noise-overlay" />

      {/* Floating accent */}
      <Floating amplitude={15} duration={6000} delay={0} className="absolute top-20 left-10 pointer-events-none">
        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-brand-500/15 blur-2xl rotate-12" />
      </Floating>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-12 px-6 py-12 lg:grid-cols-2 lg:items-center lg:px-12">
        {/* Left: employer value prop */}
        <ScrollReveal direction="left" className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <AnimatedBrandLogo size="lg" />
          </Link>

          <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 backdrop-blur-sm dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            Employer workspace
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 leading-tight sm:text-6xl dark:text-white">
            Hire verified AI talent{" "}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-400 dark:via-cyan-400 dark:to-indigo-400 bg-clip-text text-transparent">
              with real proof.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Post jobs and freelance gigs, review full candidate profiles with scores and projects, and manage your
            pipeline in one place.
          </p>

          <ul className="mt-10 space-y-5">
            {[
              {
                icon: Briefcase,
                title: "Post jobs & gigs",
                body: "Roles go live on the student Jobs and Opportunity boards instantly.",
                color: "from-brand-500 to-indigo-600",
              },
              {
                icon: Users,
                title: "Applications inbox",
                body: "Get notified when students apply and move them through your pipeline.",
                color: "from-indigo-500 to-purple-600",
              },
              {
                icon: ShieldCheck,
                title: "Full candidate profile",
                body: "See score, verified skills, projects, assessments, and experience.",
                color: "from-purple-500 to-pink-600",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base dark:text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed dark:text-slate-400">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex items-center gap-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Looking for a student account?{" "}
              <Link href="/signin?mode=sign-in" className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                Student login →
              </Link>
            </p>
          </div>
        </ScrollReveal>

        {/* Right: auth card */}
        <ScrollReveal direction="up" delay={150} className="flex flex-col items-center justify-center">
          {/* Mobile header */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center lg:hidden">
            <GlowOnHover color="brand" intensity="normal">
              <AnimatedBrandLogo size="xl" />
            </GlowOnHover>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200/60 px-4 py-2 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-400/30 dark:text-indigo-300">
              <Building2 className="h-3.5 w-3.5" />
              Employer {mode === "sign-in" ? "sign in" : "sign up"}
            </div>
          </div>

          {/* Auth Card - Premium Glass */}
          <div className="w-full max-w-md">
            <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.07]">
              {/* Card inner glow */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 via-transparent to-indigo-500/[0.03] dark:from-white/[0.08] dark:via-transparent dark:to-indigo-500/[0.05]" />

              <div className="relative">
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-lg shadow-brand-500/30">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {mode === "sign-in" ? "Welcome back" : "Get started"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {mode === "sign-in"
                      ? "Sign in to manage jobs and applications"
                      : "Create your company hiring account"}
                  </p>
                </div>

                <AuthComponent
                  mode={mode}
                  brandName=""
                  logo={<BrandLogo variant="icon-only" size="lg" />}
                  onOAuth={handleOAuth}
                  onEmailSubmit={handleEmailSubmit}
                  compact={true}
                  switchHref={
                    mode === "sign-up" ? "/employer/signin?mode=sign-in" : "/employer/signin?mode=sign-up"
                  }
                />
              </div>
            </div>

            {/* Mobile student link */}
            <p className="mt-6 text-center text-sm text-slate-500 lg:hidden dark:text-slate-400">
              Student?{" "}
              <Link href="/signin?mode=sign-in" className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                Student login
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
