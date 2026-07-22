"use client";

import { createBrowserClient } from "@supabase/ssr";
import { AuthComponent, type OAuthProvider } from "@/components/ui/sign-up";
import { BrandLogo, AnimatedBrandLogo } from "@/components/brand-logo";
import { ScrollReveal, Floating, GlowOnHover } from "@/components/scroll-reveal";
import { Building2, Briefcase, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

const patternStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
};

export function EmployerSignInClient({ mode }: { mode: "sign-up" | "sign-in" }) {
  async function handleOAuth(provider: OAuthProvider) {
    const supabase = getSupabase();
    if (!supabase) {
      alert("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    // Persist intent so the auth callback routes employers correctly
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-indigo-500/25 via-brand-500/15 to-emerald-500/20 blur-[150px] animate-float-slow"
          style={{ animationDuration: "12s" }}
        />
        <div
          className="absolute top-20 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-brand-500/15 via-indigo-500/15 to-purple-400/15 blur-[120px] animate-float-slow"
          style={{ animationDuration: "15s", animationDelay: "2s" }}
        />
      </div>

      <div className="noise-overlay" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={patternStyle} />

      <Floating amplitude={15} duration={6000} delay={0} className="absolute top-20 left-10 pointer-events-none">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-brand-500/20 blur-xl rotate-12" />
      </Floating>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2 lg:items-center lg:px-8">
        {/* Left: employer value prop */}
        <ScrollReveal direction="left" className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-2">
            <AnimatedBrandLogo size="lg" />
          </Link>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/60 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Building2 className="h-3.5 w-3.5" />
            Employer workspace
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-primary sm:text-5xl">
            Hire verified AI talent with real proof.
          </h1>
          <p className="mt-4 max-w-md text-base text-secondary">
            Post jobs and freelance gigs, review full candidate profiles with scores and projects, and manage your
            pipeline in one place.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              {
                icon: Briefcase,
                title: "Post jobs & gigs",
                body: "Roles go live on the student Jobs and Opportunity boards instantly.",
              },
              {
                icon: Users,
                title: "Applications inbox",
                body: "Get notified when students apply and move them through your pipeline.",
              },
              {
                icon: ShieldCheck,
                title: "Full candidate profile",
                body: "See score, verified skills, projects, assessments, and experience.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-primary">{item.title}</p>
                  <p className="text-sm text-secondary">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-secondary">
            Looking for a student account?{" "}
            <Link href="/signin?mode=sign-in" className="font-bold text-brand-600 hover:underline">
              Student login →
            </Link>
          </p>
        </ScrollReveal>

        {/* Right: auth */}
        <ScrollReveal direction="up" delay={150} className="flex flex-col items-center justify-center">
          <div className="mb-6 flex flex-col items-center gap-3 text-center lg:hidden">
            <GlowOnHover color="brand" intensity="normal">
              <AnimatedBrandLogo size="xl" />
            </GlowOnHover>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Building2 className="h-3.5 w-3.5" />
              Employer {mode === "sign-in" ? "sign in" : "sign up"}
            </div>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-slate-200/70 bg-white/70 p-2 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/50">
            <div className="px-4 pt-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Employer account
              </p>
              <p className="mt-1 text-sm text-secondary">
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
              switchHref={
                mode === "sign-up" ? "/employer/signin?mode=sign-in" : "/employer/signin?mode=sign-up"
              }
            />
          </div>

          <p className="mt-6 text-center text-sm text-secondary lg:hidden">
            Student?{" "}
            <Link href="/signin?mode=sign-in" className="font-bold text-brand-600 hover:underline">
              Student login
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </div>
  );
}
