import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Zap, Brain, Trophy } from "lucide-react";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";

const phases = [
  { 
    title: "Foundation", 
    body: "Python, APIs, Git, deployment basics and AI product thinking.", 
    icon: "⬡",
    color: "brand",
    iconBg: "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400",
  },
  { 
    title: "Applied AI", 
    body: "Prompt engineering, Claude apps, embeddings and evaluation.", 
    icon: "⚡",
    color: "brand",
    iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  },
  { 
    title: "RAG + Agents", 
    body: "PDF chat, retrieval quality, LangGraph patterns and tool use.", 
    icon: "🧠",
    color: "success",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  { 
    title: "Capstone", 
    body: "A deployed, reviewed project linked on the Verified AI Profile.", 
    icon: "🏆",
    color: "warning",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  },
] as const;

export default function AcademyPage() {
  return (
    <div className="relative py-16 sm:py-20 lg:py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-full -translate-x-1/2 max-w-7xl overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute left-1/4 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-brand-500/20 via-indigo-500/10 to-purple-500/20 blur-[100px] animate-float-slow" />
        <div className="absolute right-1/4 h-[250px] w-[250px] rounded-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-brand-400/10 blur-[80px] animate-float-slow" style={{ animationDuration: '8s', animationDelay: '1s' }} />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" className="text-center">
          <p className="font-semibold text-brand-600 dark:text-brand-400 animate-fade-in-up">Academy</p>
          <h1 className="mt-2 text-4xl font-black text-primary sm:text-5xl animate-fade-in-up delay-100">
            Roadmaps that end in proof, not certificates.
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-secondary animate-fade-in-up delay-200">
            CalibiAI cohorts are designed around shipped artifacts, hands-on assessments and a deterministic score that startups can audit.
          </p>
        </ScrollReveal>

        <StaggerReveal staggerDelay={150} direction="up" className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase) => (
            <ScrollReveal key={phase.title} direction="up" className="group">
              <GlowOnHover color={phase.color as "brand" | "success" | "warning"} intensity="subtle">
                <div className="glass-panel p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group-hover:border-brand-500/50 cursor-pointer">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${phase.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">{phase.icon}</span>
                  </div>
                  <h2 className="mt-4 font-bold text-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {phase.title}
                  </h2>
                  <p className="mt-2 text-sm text-secondary">{phase.body}</p>
                </div>
              </GlowOnHover>
            </ScrollReveal>
          ))}
        </StaggerReveal>

        <ScrollReveal direction="up" delay={300} className="mt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 p-8 text-white text-center shadow-2xl glass-panel-strong">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            
            <div className="relative">
              <Floating amplitude={8} duration={4000}>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 border border-brand-500/30 px-3 py-1 text-xs font-bold text-brand-300 mb-4">
                  <Zap className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
                  <span>Ready to begin?</span>
                </div>
              </Floating>
              
              <h2 className="text-2xl font-black sm:text-3xl">Ready to start your journey?</h2>
              <p className="mt-2 text-slate-300 max-w-lg mx-auto">Join the community and start building verified projects today.</p>
              <div className="mt-6 flex justify-center gap-4">
                <Link href="/community" className="btn-primary bg-brand-500 hover:bg-brand-600 group">
                  Join Community
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/onboarding" className="btn-secondary border-white/20 text-white hover:bg-white/10">
                  Start Onboarding
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}