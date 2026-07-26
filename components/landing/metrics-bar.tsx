"use client";

import { useCountUp } from "./use-count-up";
import { GraduationCap, Users, Building2 } from "lucide-react";

interface StatItemProps {
  end: number;
  suffix: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  glowClass: string;
  iconColor: string;
}

function StatItem({ end, suffix, label, desc, icon: Icon, glowClass, iconColor }: StatItemProps) {
  const { display, ref } = useCountUp({
    end,
    suffix,
    duration: 2200,
    startOnView: true,
  });

  return (
    <div className="flex items-center gap-4 px-6 py-4 sm:px-8 sm:py-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconColor} ${glowClass} border border-slate-200/80 dark:border-white/10 transition-transform duration-300 hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span ref={ref} className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
            {display}
          </span>
          <span className="text-sm font-bold text-slate-600 dark:text-white/50">{label}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export function MetricsBar() {
  return (
    <section className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className="glass flex flex-col items-center justify-center divide-y divide-slate-200/80 overflow-hidden sm:flex-row sm:divide-x sm:divide-y-0 sm:rounded-2xl dark:divide-white/8"
        >
          <StatItem
            end={10}
            suffix="+"
            label="Colleges"
            desc="Partnered campuses"
            icon={GraduationCap}
            glowClass="icon-glow-amber"
            iconColor="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          />
          <StatItem
            end={1000}
            suffix="+"
            label="Students"
            desc="Applied AI builders"
            icon={Users}
            glowClass="icon-glow-blue"
            iconColor="bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
          />
          <StatItem
            end={20}
            suffix="+"
            label="Startups"
            desc="Hiring partners"
            icon={Building2}
            glowClass="icon-glow-purple"
            iconColor="bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400"
          />
        </div>
      </div>
    </section>
  );
}
