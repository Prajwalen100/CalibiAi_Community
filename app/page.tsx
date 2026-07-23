import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Heart,
  Quote,
  Rocket,
  Sparkles,
  Target,
  Users,
  Shield,
  Zap,
  BarChart3,
  Users2,
  TrendingUp,
  Code2,
  BadgeCheck,
  Search,
  Calendar,
  Lightbulb,
  Globe,
} from "lucide-react";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";

const testimonials = [
  {
    quote:
      "CalibiAI's real-world AI applications gave me the clarity I needed to start building my own projects.",
    name: "Nishant Singh",
    role: "3rd Year Computer Science Student",
    avatar: "/images/avatars/nishant-singh.jpg",
    gender: "male",
  },
  {
    quote:
      "Their hands-on demonstrations and career guidance motivated me to explore AI further.",
    name: "Pratik Harne",
    role: "3rd Year Computer Science Student",
    avatar: "/images/avatars/pratik-harne.jpg",
    gender: "male",
  },
  {
    quote:
      "The workshop introduced us to the latest AI tools, practical use cases shaping the future.",
    name: "Nisha Pawar",
    role: "3rd Year AI & Data Science Student",
    avatar: "/images/avatars/nisha-pawar.jpg",
    gender: "female",
  },
  {
    quote:
      "Attending CalibiAI's online AI workshop left me with greater confidence to continue my learning journey.",
    name: "Nidhi Chavan",
    role: "3rd Year Computer Science Student",
    avatar: "/images/avatars/nidhi-chavan.jpg",
    gender: "female",
  },
  {
    quote:
      "CalibiAI gave me a clear direction on how to begin my journey in this field.",
    name: "Om Khatke",
    role: "Engineering Student",
    avatar: "/images/avatars/om-khatke.jpg",
    gender: "male",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[900px] w-full max-w-7xl -translate-x-1/2 overflow-hidden opacity-50 dark:opacity-30">
        <div
          className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-500/30 via-indigo-500/20 to-purple-500/30 blur-[120px] animate-float-slow"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute top-20 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-brand-400/20 blur-[100px] animate-float-slow"
          style={{ animationDuration: "10s", animationDelay: "1s" }}
        />
      </div>
      <div className="noise-overlay" />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
        {/* Hero Grid Layout */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column: Content */}
          <div className="max-w-2xl">
            <ScrollReveal direction="up">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-50/60 px-4 py-2 text-xs font-bold text-brand-700 backdrop-blur-md dark:border-brand-900/40 dark:bg-brand-950/40 dark:text-brand-300">
                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                <Sparkles className="h-3.5 w-3.5" />
                The Trusted AI Talent Ecosystem
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-primary sm:text-5xl lg:text-6xl">
                The trusted ecosystem for{" "}
                <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  applied AI talent
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p className="mt-5 text-base leading-relaxed text-secondary sm:text-lg lg:text-xl">
                Where ambitious engineering students build verified portfolios, and forward-thinking companies hire proven AI builders.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/signin?mode=sign-up"
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
                >
                  <GraduationCap className="h-5 w-5" />
                  Build your AI profile
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/employer/signin?mode=sign-up"
                  className="btn-outline inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-500 px-8 py-4 text-base font-bold text-brand-600 transition-all hover:bg-brand-50 hover:border-brand-600 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-950/30"
                >
                  <Building2 className="h-5 w-5" />
                  Hire verified talent
                </Link>
              </div>
            </ScrollReveal>

            {/* Trust Badges */}
            <ScrollReveal direction="up" delay={400}>
              <div className="mt-10 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm border border-slate-200/60 dark:bg-slate-900/80 dark:text-slate-200 dark:border-slate-800">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Verified Portfolios
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm border border-slate-200/60 dark:bg-slate-900/80 dark:text-slate-200 dark:border-slate-800">
                  <Zap className="h-4 w-4 text-amber-500" />
                  AI-Powered Matching
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm border border-slate-200/60 dark:bg-slate-900/80 dark:text-slate-200 dark:border-slate-800">
                  <TrendingUp className="h-4 w-4 text-brand-500" />
                  Real Project Experience
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Live Audit Engine Card */}
          <ScrollReveal direction="right" delay={200}>
            <div className="relative">
              {/* Background Glow */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-500/20 via-indigo-500/10 to-purple-500/20 blur-2xl -z-10" />
              
              {/* Main Card */}
              <div className="relative rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 sm:p-8">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-primary">Live Audit Engine</h3>
                      <p className="text-xs text-secondary">Real-time portfolio verification</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Audit Score */}
                <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 p-4 dark:from-brand-950/30 dark:to-indigo-950/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-secondary">Portfolio Score</span>
                    <span className="text-2xl font-black text-brand-600">94/100</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500" style={{ width: '94%' }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-subtle">
                    <span>Skills</span>
                    <span>Projects</span>
                    <span>Verification</span>
                  </div>
                </div>

                {/* Skills Verified */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-secondary mb-3">Verified Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Machine Learning', 'Python', 'TensorFlow', 'Data Science', 'Neural Networks'].map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                        <BadgeCheck className="h-3 w-3" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Projects */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-secondary mb-3">Recent Projects</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Sentiment Analysis API', score: 98, icon: Code2 },
                      { name: 'Image Classification Model', score: 95, icon: Search },
                    ].map((project) => (
                      <div key={project.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <project.icon className="h-4 w-4 text-brand-500" />
                          <span className="text-sm font-semibold text-primary">{project.name}</span>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          {project.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Indicator */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/50">
                  <Users2 className="h-5 w-5 text-brand-500" />
                  <div>
                    <p className="text-xs font-bold text-primary">247 employers viewed profiles today</p>
                    <p className="text-xs text-subtle">Your profile is in the top 5%</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Trust Bar - Bottom */}
        <ScrollReveal direction="up" delay={500}>
          <div className="mt-16 rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
            <div className="grid grid-cols-1 divide-y divide-slate-200/60 dark:divide-slate-800/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center justify-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-lg">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-primary">10+</p>
                  <p className="text-sm font-semibold text-secondary">Colleges</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-primary">1000+</p>
                  <p className="text-sm font-semibold text-secondary">Students</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-primary">20+</p>
                  <p className="text-sm font-semibold text-secondary">Startups</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Navigation Pills */}
        <ScrollReveal direction="up" delay={600}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-subtle">
            <a href="#story" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
              Our story
            </a>
            <a href="#testimonials" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
              Testimonials
            </a>
            <a href="#motto" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
              Get started
            </a>
          </div>
        </ScrollReveal>
      </section>

      {/* STORY - Vertical Timeline */}
      <section id="story" className="scroll-mt-24 relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 py-24">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-[150px]" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center mb-20">
            <p className="font-bold text-brand-400 tracking-wide uppercase text-sm">Our Journey</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              From consulting to{" "}
              <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                ecosystem
              </span>
            </h2>
          </ScrollReveal>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/0 via-brand-500/50 to-brand-500/0 sm:left-1/2 sm:-translate-x-1/2" />

            {[
              {
                year: "2024",
                title: "The Consultative Foundation",
                text: "Began as an AI Consulting & Innovation Company, helping businesses solve real-world challenges through artificial intelligence.",
                icon: Calendar,
              },
              {
                year: "Campus",
                title: "Bridging the Campus Gap",
                text: "While conducting workshops and guest lectures nationwide, a common question emerged: 'We want practical AI skills, not just theory.'",
                icon: GraduationCap,
              },
              {
                year: "Insight",
                title: "The Turning Point",
                text: "Students had courses but lacked real project experience and industry mentorship. This gap became the turning point.",
                icon: Lightbulb,
              },
              {
                year: "2026",
                title: "A Full-Scale Ecosystem",
                text: "Re-launched as a comprehensive platform where students, colleges, educators, and startups collaborate around applied AI education.",
                icon: Globe,
              },
            ].map((item, index) => (
              <ScrollReveal key={item.year} direction={index % 2 === 0 ? "left" : "right"} delay={index * 150}>
                <div className={`relative flex items-start gap-6 mb-16 sm:mb-20 ${
                  index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}>
                  {/* Node */}
                  <div className="absolute left-8 sm:left-1/2 sm:-translate-x-1/2 z-10">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      {/* Glow */}
                      <div className="absolute inset-0 rounded-2xl bg-brand-500/30 blur-xl -z-10" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`ml-24 sm:ml-0 sm:w-[calc(50%-4rem)] ${
                    index % 2 === 0 ? "sm:text-right sm:pr-8" : "sm:text-left sm:pl-8"
                  }`}>
                    <span className="inline-block rounded-full bg-brand-500/20 px-4 py-1.5 text-sm font-bold text-brand-300 mb-3">
                      {item.year}
                    </span>
                    <h3 className="text-xl font-black text-white mb-3">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300 max-w-md" style={index % 2 !== 0 ? {} : { marginLeft: "auto" }}>
                      {item.text}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="testimonials"
        className="scroll-mt-24 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 py-24"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-brand-500/8 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 bottom-1/4 -z-10 h-[350px] w-[350px] rounded-full bg-indigo-500/8 blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center mb-16">
            <p className="font-bold text-brand-400 tracking-wide uppercase text-sm">Testimonials</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
              Voices from the{" "}
              <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                classroom
              </span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Students across engineering colleges on workshops that went beyond theory.
            </p>
          </ScrollReveal>

          <StaggerReveal staggerDelay={120} direction="up" className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((t) => (
              <article
                key={t.name}
                className="group relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:border-brand-500/30 hover:bg-white/8 hover:shadow-2xl hover:shadow-brand-500/10"
              >
                {/* Quote icon */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15">
                  <Quote className="h-5 w-5 text-brand-400" />
                </div>

                {/* Quote text */}
                <p className="flex-1 text-base font-semibold leading-relaxed text-white/90">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Read full review link */}
                <button className="mt-3 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors opacity-0 group-hover:opacity-100 duration-300">
                  Read full review →
                </button>

                {/* Author */}
                <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-brand-500/30">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* FINAL CTA - Motto */}
      <section id="motto" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl sm:p-12 lg:p-16 dark:border-slate-800">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/15 blur-[100px]" />

              <div className="relative mx-auto max-w-3xl text-center">
                <h2 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                  Learn. Build. Lead.
                </h2>

                <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signin?mode=sign-up"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                  >
                    <GraduationCap className="h-5 w-5" />
                    Join as Student
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/employer/signin?mode=sign-up"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-blue-400/50 bg-white/5 px-8 py-4 text-base font-bold text-blue-200 backdrop-blur transition-all hover:bg-white/10 hover:border-blue-400 hover:-translate-y-0.5"
                  >
                    <Building2 className="h-5 w-5" />
                    Join as Employer
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
