"use client";

import { motion, type Variants } from "framer-motion";
import { GraduationCap, Users, Building2, Globe, ArrowUpRight } from "lucide-react";

const stats = [
  {
    number: "10+",
    label: "Colleges",
    desc: "Partnered across engineering campuses",
    icon: GraduationCap,
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badge: "Campus MOUs",
  },
  {
    number: "1000+",
    label: "Students",
    desc: "Mentored in applied AI engineering",
    icon: Users,
    gradient: "from-brand-500/20 via-brand-500/10 to-transparent",
    iconBg: "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20",
    badge: "Applied Builders",
  },
  {
    number: "20+",
    label: "Startups",
    desc: "Hiring partners for verified talent",
    icon: Building2,
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    badge: "Hiring Active",
  },
  {
    number: "Nationwide",
    label: "College Network",
    desc: "Building India's largest AI education ecosystem",
    icon: Globe,
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badge: "Ecosystem",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

export function AnimatedStats() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 backdrop-blur-xl transition-all duration-300 shadow-soft hover:shadow-2xl hover:border-brand-500/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-brand-400/50"
          >
            {/* Ambient Background Gradient Glow on Hover */}
            <div
              className={`absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br ${item.gradient} blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60 pointer-events-none`}
            />

            <div className="relative z-10 flex items-start justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.iconBg} backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-50/80 px-2.5 py-1 text-[11px] font-bold text-slate-600 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                {item.badge}
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.number}
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {item.label}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed dark:text-slate-400">
                {item.desc}
              </p>
            </div>

            {/* Bottom accent glow bar */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-brand-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
