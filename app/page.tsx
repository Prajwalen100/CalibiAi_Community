import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudentAccess } from "@/lib/auth/student-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Shield,
  Zap,
  TrendingUp,
} from "lucide-react";

import { MeshGradientBackground } from "@/components/landing/mesh-gradient-bg";
import { LiveAuditCard } from "@/components/landing/live-audit-card";
import { MetricsBar } from "@/components/landing/metrics-bar";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { TrustedByBanner } from "@/components/landing/trusted-by";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // The marketing landing page is anonymous-only. Returning users should land
  // in their durable student/employer journey instead of seeing sign-up CTAs
  // again after logging in.
  let authenticatedDestination: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const access = await getStudentAccess(supabase, user.id);
      authenticatedDestination = access.isEmployer
        ? "/employer/dashboard"
        : access.nextPath;
    }
  } catch {
    // Keep the public landing page available during an auth service outage.
  }
  if (authenticatedDestination) redirect(authenticatedDestination);

  return (
    <div className="dark relative min-h-screen overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <MeshGradientBackground />

      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left Column: Hero Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              The Trusted AI Talent Ecosystem
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              The trusted ecosystem for{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                applied AI talent
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg lg:text-xl">
              Where ambitious engineering students build verified portfolios,
              and forward-thinking companies hire proven AI builders.
            </p>

            {/* Primary CTA - Solid, high contrast */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/signin?mode=sign-up"
                className="btn-cta-solid text-base"
              >
                <GraduationCap className="h-5 w-5" />
                Build Your AI Portfolio
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/employer/signin?mode=sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-base font-bold text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-white/30"
              >
                <Building2 className="h-5 w-5" />
                Hire verified talent
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white/60 backdrop-blur-sm">
                <Shield className="h-4 w-4 text-emerald-400" />
                Verified Portfolios
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white/60 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-amber-400" />
                AI-Powered Matching
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white/60 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                Real Project Experience
              </div>
            </div>
          </div>

          {/* Right Column: Live Audit Engine Glass Card */}
          <div className="relative lg:pl-8">
            {/* Background glow behind card */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 blur-3xl -z-10 opacity-60" />
            <LiveAuditCard />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          METRICS BAR
         ═══════════════════════════════════════════════════════════ */}
      <MetricsBar />

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
         ═══════════════════════════════════════════════════════════ */}
      <HowItWorks />

      {/* ═══════════════════════════════════════════════════════════
          TESTIMONIALS
         ═══════════════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ═══════════════════════════════════════════════════════════
          TRUSTED BY BANNER
         ═══════════════════════════════════════════════════════════ */}
      <TrustedByBanner />

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA - Motto
         ═══════════════════════════════════════════════════════════ */}
      <section id="motto" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass relative overflow-hidden border border-white/10 p-8 text-white sm:p-12 lg:p-16" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}>
            {/* Ambient orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/15 blur-[100px]" />

            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                Learn. Build. Lead.
              </h2>
              <p className="mt-4 text-base text-white/40 max-w-md mx-auto">
                Join the ecosystem where verified talent meets opportunity.
              </p>

              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signin?mode=sign-up"
                  className="btn-cta-solid text-base"
                >
                  <GraduationCap className="h-5 w-5" />
                  Join as Student
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/employer/signin?mode=sign-up"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-8 py-4 text-base font-bold text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/12 hover:text-white hover:border-white/30 hover:scale-105"
                >
                  <Building2 className="h-5 w-5" />
                  Join as Employer
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
