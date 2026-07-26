"use client";

import {
  Code2,
  ShieldCheck,
  Rocket,
  ArrowRight,
  Layers,
  ScanLine,
  Handshake,
} from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Build Real-World Projects",
    subtitle: "Apply your knowledge",
    description:
      "Work on industry-grade AI challenges curated by experts. From computer vision to NLP pipelines — build projects that solve actual problems, not toy examples.",
    icon: Layers,
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/15 text-blue-400",
    glowColor: "blue",
  },
  {
    step: "02",
    title: "Get Code Verified by AI",
    subtitle: "Prove your expertise",
    description:
      "Our Live Audit Engine analyzes your code quality, architecture decisions, and model performance. Receive a verified portfolio score that employers trust.",
    icon: ScanLine,
    gradient: "from-purple-500 to-indigo-500",
    iconBg: "bg-purple-500/15 text-purple-400",
    glowColor: "purple",
  },
  {
    step: "03",
    title: "Get Hired by Top Startups",
    subtitle: "Launch your career",
    description:
      "Verified skills unlock direct introductions to AI startups and tech companies. Skip the resume black hole — let your verified portfolio speak for itself.",
    icon: Handshake,
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    glowColor: "emerald",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Your path to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              verified AI talent
            </span>
          </h2>
          <p className="mt-4 text-base text-white/50 max-w-xl mx-auto">
            Three steps from learning to earning. No certificates, no fluff — just proof.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="glass group relative overflow-hidden p-6 sm:p-8 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl"
            >
              {/* Background glow on hover */}
              <div
                className={`absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}
              />

              {/* Step number */}
              <div className="mb-6 flex items-center justify-between">
                <span className="text-5xl font-black text-white/5 group-hover:text-white/10 transition-colors">
                  {item.step}
                </span>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg} border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <item.icon className="h-7 w-7" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-black text-white mb-2">
                {item.title}
              </h3>
              <p className="text-sm font-bold text-white/40 mb-4">
                {item.subtitle}
              </p>
              <p className="text-sm leading-relaxed text-white/60">
                {item.description}
              </p>

              {/* Arrow indicator */}
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-white/30 group-hover:text-white/60 transition-colors">
                <span>
                  {index < steps.length - 1 ? "Next step" : "Get started"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
