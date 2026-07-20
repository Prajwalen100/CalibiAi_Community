import Link from "next/link";
import { CheckCircle2, ShieldCheck, Trophy, Users, ArrowRight, Sparkles, Zap, Star } from "lucide-react";
import { LeadForm } from "@/components/lead-form";
import { TypingHeading } from "@/components/typing-heading";
import { AnimatedStats } from "@/components/animated-stats";
import { HeroArcadeDemo } from "@/components/hero-arcade-demo";
import { ScrollReveal, StaggerReveal, Floating, GlowOnHover } from "@/components/scroll-reveal";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Radial Glow Mesh */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[800px] w-full -translate-x-1/2 max-w-7xl overflow-hidden opacity-50 dark:opacity-30">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-500/30 via-indigo-500/20 to-purple-500/30 blur-[120px] animate-float-slow" style={{ animationDuration: '8s' }} />
        <div className="absolute top-20 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-brand-400/20 blur-[100px] animate-float-slow" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:pt-20 lg:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Copy & Actions */}
          <ScrollReveal direction="left" className="lg:col-span-7">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-50/50 px-4 py-2 text-xs font-bold text-brand-700 backdrop-blur-md shadow-sm dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-900/30 animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <Zap className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span>Verified AI Profiles + Real Placement Outcomes</span>
            </div>

            {/* Dynamic Typing Title */}
            <div className="mt-4 animate-fade-in-up delay-200">
              <TypingHeading text="Become a verified, hire-ready applied-AI engineer." />
            </div>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg animate-fade-in-up delay-300">
              CalibiAI helps engineering students build real AI flagship projects, pass hands-on assessments, and publish a startup-trusted profile where every score point links directly to audit proof.
            </p>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center animate-fade-in-up delay-400">
              <Link href="#join" className="btn-primary text-base shadow-lg shadow-brand-500/25 group">
                Join a free workshop
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link href="/success-stories" className="btn-secondary text-base">
                See verified placements
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex items-center gap-4 text-xs font-semibold text-subtle animate-fade-in-up delay-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Zero Certificate Padding</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Decay-Aware Score</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Interactive Arcade Product Preview */}
          <ScrollReveal direction="right" delay={200} className="lg:col-span-5">
            <GlowOnHover color="brand" intensity="normal">
              <Floating amplitude={12} duration={4000}>
                <HeroArcadeDemo />
              </Floating>
            </GlowOnHover>
          </ScrollReveal>
        </div>

        {/* REVAMPED STATS GRID */}
        <ScrollReveal direction="up" delay={300} className="mt-8">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-subtle">
              Ecosystem & Impact Metrics
            </h3>
          </div>
          <AnimatedStats />
        </ScrollReveal>
      </section>

      {/* FLYWHEEL / HOW IT WORKS */}
      <section className="relative border-t border-slate-200/60 bg-white/50 py-20 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <Star className="h-3.5 w-3.5" /> Proven Methodology
            </span>
            <h2 className="mt-3 text-3xl font-black text-primary sm:text-4xl">
              A flywheel built around trusted talent proof.
            </h2>
            <p className="mt-3 text-sm text-secondary">
              From college workshop to verified hiring signal — every step adds auditable evidence to your profile.
            </p>
          </ScrollReveal>

          <StaggerReveal staggerDelay={150} direction="up" className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                step: "01",
                title: "Join Community",
                desc: "Start with a short workshop, set your AI career track, and join peer squads.",
                gradient: "from-brand-500/20 to-transparent",
                color: "brand" as const,
              },
              {
                icon: Trophy,
                step: "02",
                title: "Build Projects",
                desc: "Ship production RAG engines, prompt evaluation suites, and AI workflows.",
                gradient: "from-purple-500/20 to-transparent",
                color: "purple" as const,
              },
              {
                icon: ShieldCheck,
                step: "03",
                title: "Get Verified",
                desc: "Only linked, code-reviewed artifacts and passing assessments earn score points.",
                gradient: "from-emerald-500/20 to-transparent",
                color: "success" as const,
              },
              {
                icon: CheckCircle2,
                step: "04",
                title: "Placement Support",
                desc: "Get surfaced directly to hiring startups looking for auditable AI engineering skills.",
                gradient: "from-amber-500/20 to-transparent",
                color: "warning" as const,
              },
            ].map((item) => {
              const Icon = item.icon;
              const colorClasses: Record<string, string> = {
                brand: "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400",
                purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
                success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
                warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
              };
              
              return (
                <GlowOnHover key={item.title} color={item.color} intensity="subtle" className="group relative overflow-hidden glass-panel p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${colorClasses[item.color]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-2xl font-black text-subtle group-hover:text-brand-500 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-secondary">
                    {item.desc}
                  </p>
                </GlowOnHover>
              );
            })}
          </StaggerReveal>
        </div>
      </section>

      {/* WHAT STARTUPS VERIFY */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 p-8 text-white shadow-2xl sm:p-12 dark:border-slate-800 glass-panel-strong">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            
            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 border border-brand-500/30 px-3 py-1 text-xs font-bold text-brand-300">
                  <ShieldCheck className="h-4 w-4 text-brand-400" />
                  <span>Auditable Hiring Standard</span>
                </div>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                  What startups can verify on every CalibiAI profile.
                </h2>
                <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                  No padded resumes. Hiring managers review actual code commits, live endpoints, and benchmark evaluation logs.
                </p>
              </div>

              <div className="lg:col-span-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Live project links & verified GitHub repos",
                  "Passed hands-on skill & code assessments",
                  "Originality and plagiarism audit status",
                  "Current activity, decay-aware score & tier",
                ].map((item, index) => (
                  <ScrollReveal key={item} direction="right" delay={index * 100} className="group">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md hover:border-brand-500/40 hover:bg-white/10 transition-all duration-300">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200">{item}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* START FREE / WORKSHOP REGISTRATION */}
      <section id="join" className="relative py-20 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-500/10 via-transparent to-purple-500/10 blur-[100px] opacity-50 dark:opacity-30 animate-float-slow" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <ScrollReveal direction="left" className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3.5 py-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 dark:bg-brand-950/30 dark:border-brand-900/30">
                ⚡ Start Free
              </span>
              <h2 className="mt-4 text-3xl font-black text-primary sm:text-4xl">
                Register for the next workshop.
              </h2>
              <p className="mt-4 text-sm text-secondary leading-relaxed">
                Take the first lightweight step toward building a verified AI engineering profile. CalibiAI captures core details now and enriches your roadmap after onboarding.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={200} className="lg:col-span-6">
              <GlowOnHover color="brand" intensity="normal">
                <div className="glass-panel-strong p-8">
                  <LeadForm source="workshop" />
                </div>
              </GlowOnHover>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}