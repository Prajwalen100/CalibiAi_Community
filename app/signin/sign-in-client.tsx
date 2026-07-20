"use client";

import { createBrowserClient } from "@supabase/ssr";
import { AuthComponent, type OAuthProvider } from "@/components/ui/sign-up";
import { BrandLogo, AnimatedBrandLogo } from "@/components/brand-logo";
import { ScrollReveal, Floating, GlowOnHover } from "@/components/scroll-reveal";
import { ShieldCheck, Zap, Sparkles, ArrowRight } from "lucide-react";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

const patternStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
};

export function SignInPageClient({ mode }: { mode: "sign-up" | "sign-in" }) {
  async function handleOAuth(provider: OAuthProvider) {
    const supabase = getSupabase();
    if (!supabase) {
      alert("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
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

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) return error.message;
      if (!data.session) {
        return "Check your inbox — we sent you a confirmation link to finish signing up.";
      }
      window.location.assign("/onboarding");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    window.location.assign("/community");
    return;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-500/25 via-indigo-500/15 to-purple-500/25 blur-[150px] animate-float-slow" style={{ animationDuration: '12s' }} />
        <div className="absolute top-20 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-500/15 via-pink-500/15 to-brand-400/15 blur-[120px] animate-float-slow" style={{ animationDuration: '15s', animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-gradient-to-t from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-[100px] animate-float-slow" style={{ animationDuration: '18s', animationDelay: '4s' }} />
      </div>

      {/* Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* Floating Decorative Elements */}
      <Floating amplitude={15} duration={6000} delay={0} className="absolute top-20 left-10 pointer-events-none">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 blur-xl rotate-12" />
      </Floating>
      <Floating amplitude={12} duration={5000} delay={1000} className="absolute top-40 right-10 pointer-events-none">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-lg rotate-[-8deg]" />
      </Floating>
      <Floating amplitude={18} duration={7000} delay={2000} className="absolute bottom-40 left-20 pointer-events-none">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-xl rotate-6" />
      </Floating>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={patternStyle} />

      <ScrollReveal direction="up" delay={200} className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <GlowOnHover color="brand" intensity="normal" className="group">
            <AnimatedBrandLogo size="xl" />
          </GlowOnHover>
          
          <div className="flex items-center gap-2 rounded-full bg-brand-50/50 px-4 py-1.5 text-xs font-bold text-brand-700 backdrop-blur-md shadow-sm dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-900/30 border border-brand-200/50 dark:border-brand-900/30 animate-fade-in-up delay-200">
            <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <Zap className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Verified AI Profiles + Real Placement Outcomes</span>
          </div>
        </div>

        {/* Auth Component */}
        <AuthComponent
          mode={mode}
          brandName=""
          logo={<BrandLogo variant="icon-only" size="lg" />}
          onOAuth={handleOAuth}
          onEmailSubmit={handleEmailSubmit}
          switchHref={mode === "sign-up" ? "/signin?mode=sign-in" : "/signin?mode=sign-up"}
        />

        {/* Footer Links */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 text-sm text-secondary">
          <p className="text-center">By continuing, you agree to our</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/terms" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">Terms of Service</a>
            <span className="text-subtle">·</span>
            <a href="/privacy" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">Privacy Policy</a>
            <span className="text-subtle">·</span>
            <a href="/cookies" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}