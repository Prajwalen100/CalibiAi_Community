"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
  Award,
  Briefcase,
  Users,
  DollarSign,
  Building2,
  ChevronDown,
  ArrowRight,
  Code,
  Layers,
  Globe,
  Star,
  Zap,
  Target,
  UserCheck,
} from "lucide-react";
import {
  NON_ROADMAP_BUFFER_DAYS,
  REQUIRED_PROJECT_RATING,
  type ChecklistStatus,
  type NetworkReadiness,
} from "@/lib/network/readiness";

interface NetworkClientProps {
  readiness: NetworkReadiness;
  isSignedIn: boolean;
}

export function NetworkClient({ readiness, isSignedIn }: NetworkClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const {
    currentScore,
    requiredScore,
    remainingScore,
    scorePercent,
    remainingRoadmapDays,
    estimatedDaysToUnlock,
    isRoadmapComplete,
    totalRoadmapDays,
    completedRoadmapDays,
    verifiedProjectsCount,
    requiredProjects,
    isPortfolioComplete,
    averageProjectRating,
    meetsRatingBar,
    hasGithubPortfolio,
    hasCapstone,
    completedRequirements,
    totalRequirements,
  } = readiness;

  // SVG circular progress parameters
  const size = 160;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // Every requirement is derived from live learner data so the checklist can
  // never claim something is done when it isn't.
  const checklistItems: {
    id: number;
    title: string;
    status: ChecklistStatus;
    description: string;
    icon: typeof Target;
  }[] = [
    {
      id: 1,
      title: "Talent Score \u2265 850",
      status: currentScore >= requiredScore ? "completed" : "pending",
      description:
        currentScore >= requiredScore
          ? `Current: ${currentScore} / Required: ${requiredScore} \u2014 qualified`
          : `Current: ${currentScore} / Required: ${requiredScore} (${remainingScore} points remaining)`,
      icon: Target,
    },
    {
      id: 2,
      title: "Complete AI Roadmap",
      status: isRoadmapComplete ? "completed" : "pending",
      description:
        totalRoadmapDays === 0
          ? "Take your placement assessment to get a personalized roadmap assigned"
          : isRoadmapComplete
            ? `All ${totalRoadmapDays} roadmap days completed in sequence`
            : `${completedRoadmapDays} of ${totalRoadmapDays} roadmap days completed \u2014 ${remainingRoadmapDays} remaining`,
      icon: CheckCircle2,
    },
    {
      id: 3,
      title: "Complete Capstone Project",
      status: hasCapstone ? "completed" : "pending",
      description: hasCapstone
        ? "Production-ready end-to-end AI system published and verified"
        : "Build and publish a production-ready end-to-end AI system",
      icon: Code,
    },
    {
      id: 4,
      title: "Pass AI Technical Interview",
      status: "locked",
      description: "Automated architecture and system design verification",
      icon: Lock,
    },
    {
      id: 5,
      title: "Strong GitHub Portfolio",
      status: hasGithubPortfolio ? "completed" : "pending",
      description: hasGithubPortfolio
        ? "Verified code repository activity and automated code quality checks"
        : "Link a public repository to a verified project to pass code quality checks",
      icon: Globe,
    },
    {
      id: 6,
      title: "Complete Portfolio",
      status: isPortfolioComplete ? "completed" : "pending",
      description: `${verifiedProjectsCount} of ${requiredProjects} verified projects published to your public showcase`,
      icon: Layers,
    },
    {
      id: 7,
      title: "Minimum Project Rating",
      status: meetsRatingBar ? "completed" : averageProjectRating === null ? "locked" : "pending",
      description:
        averageProjectRating === null
          ? `Maintain an AI verification rating of \u2265 ${REQUIRED_PROJECT_RATING}/10 across projects`
          : `Current average ${averageProjectRating}/10 \u2014 required \u2265 ${REQUIRED_PROJECT_RATING}/10`,
      icon: Star,
    },
  ];

  const metricCards = [
    {
      id: 1,
      title: "Verified Engineers",
      value: "127",
      description: "Top engineers currently inside Network.",
      icon: UserCheck,
    },
    {
      id: 2,
      title: "Companies Hiring",
      value: "19",
      description: "Actively recruiting Production Ready Engineers.",
      icon: Building2,
    },
    {
      id: 3,
      title: "Active Freelance Projects",
      value: "46",
      description: "Real AI projects currently accepting proposals.",
      icon: Briefcase,
    },
    {
      id: 4,
      title: "Exclusive AI Client Requests",
      value: "12",
      description: "Premium AI automation requests managed by CalibiAI.",
      icon: Sparkles,
    },
    {
      id: 5,
      title: "Monthly Marketplace Revenue",
      value: "₹18.4L",
      description: "Total value of projects completed this month.",
      icon: DollarSign,
    },
    {
      id: 6,
      title: "Highest Engineer Earnings",
      value: "₹3.2L",
      description: "Highest monthly earnings by a Production Ready Engineer.",
      icon: TrendingUp,
    },
    {
      id: 7,
      title: "Average Monthly Income",
      value: "₹42,000",
      description: "Average earnings of active engineers.",
      icon: Award,
    },
    {
      id: 8,
      title: "Partner Companies",
      value: "32",
      description: "Companies hiring directly from CalibiAI.",
      icon: Users,
    },
  ];

  const marketplaceOpportunities = [
    {
      id: "job-1",
      title: "AI Engineer",
      company: "Apex Enterprise AI",
      compensation: "₹18 LPA",
      type: "Full-Time",
      location: "Remote",
      tags: ["LLMs", "RAG", "PyTorch"],
      category: "Verified Job",
    },
    {
      id: "free-1",
      title: "Build AI Voice Agent",
      company: "Fintech Startup",
      compensation: "₹24,000",
      type: "Fixed Price",
      location: "Remote",
      tags: ["Voice AI", "FastAPI", "WebRTC"],
      category: "Freelance Project",
    },
    {
      id: "free-2",
      title: "WhatsApp Automation",
      company: "D2C Commerce Hub",
      compensation: "₹8,000",
      type: "Contract",
      location: "Remote",
      tags: ["WhatsApp API", "LangChain", "Node.js"],
      category: "Freelance Project",
    },
    {
      id: "serv-1",
      title: "Enterprise AI Chatbot",
      company: "Global Logistics Corp",
      compensation: "₹48,000",
      type: "Fixed Price",
      location: "Remote",
      tags: ["OpenAI", "PgVector", "Security"],
      category: "Exclusive AI Service",
    },
    {
      id: "job-2",
      title: "AI Research Internship",
      company: "Neural Labs India",
      compensation: "₹45,000 / mo",
      type: "Internship",
      location: "Bangalore • Remote",
      tags: ["Transformer Architecture", "Python"],
      category: "Verified Job",
    },
    {
      id: "free-3",
      title: "CRM AI Agent",
      company: "SaaS Scaleup",
      compensation: "₹32,000",
      type: "Fixed Price",
      location: "Remote",
      tags: ["Agentic Workflows", "HubSpot API"],
      category: "Freelance Project",
    },
  ];

  const topEngineers = [
    {
      rank: 1,
      name: "A••••• S•••••",
      avatarBg: "from-emerald-400 to-teal-600",
      score: 984,
      projects: "14 Verified",
      earnings: "₹2.4L / mo",
      rating: "★ 4.98 (32 reviews)",
    },
    {
      rank: 2,
      name: "R••••• K•••••",
      avatarBg: "from-sky-400 to-indigo-600",
      score: 962,
      projects: "11 Verified",
      earnings: "₹1.8L / mo",
      rating: "★ 4.96 (24 reviews)",
    },
    {
      rank: 3,
      name: "P••••• M•••••",
      avatarBg: "from-purple-400 to-pink-600",
      score: 941,
      projects: "9 Verified",
      earnings: "₹1.5L / mo",
      rating: "★ 4.95 (18 reviews)",
    },
    {
      rank: 4,
      name: "N••••• V•••••",
      avatarBg: "from-amber-400 to-orange-600",
      score: 928,
      projects: "12 Verified",
      earnings: "₹1.2L / mo",
      rating: "★ 4.92 (21 reviews)",
    },
  ];

  const whyNetworkMatters = [
    {
      title: "Verified Jobs",
      description: "Direct placements with AI startups and enterprise engineering teams.",
      icon: Briefcase,
    },
    {
      title: "Premium Freelancing",
      description: "High-ticket client projects vetted for technical depth and fair pay.",
      icon: Code,
    },
    {
      title: "AI Client Projects",
      description: "Custom automation workflows and LLM apps sourced by CalibiAI.",
      icon: Sparkles,
    },
    {
      title: "Higher Visibility",
      description: "Your verified portfolio surfaced directly to technical recruiters.",
      icon: Users,
    },
    {
      title: "Verified Engineer Badge",
      description: "Undeniable proof of production-readiness on your public profile.",
      icon: Award,
    },
    {
      title: "Partner Company Hiring",
      description: "Fast-track interviews with 32+ CalibiAI hiring partners.",
      icon: Building2,
    },
    {
      title: "Priority Referrals",
      description: "Direct introductions from mentors and hiring coordinators.",
      icon: Zap,
    },
    {
      title: "Business Opportunities",
      description: "Collaborate on equity and co-founding AI ventures.",
      icon: Globe,
    },
    {
      title: "Monthly AI Challenges",
      description: "Exclusive sponsored hackathons and cash bounties.",
      icon: Target,
    },
    {
      title: "Higher Income Potential",
      description: "Average ₹42,000/mo freelance earnings for active members.",
      icon: DollarSign,
    },
    {
      title: "Career Growth",
      description: "Continuous mentorship, architecture code reviews, and peer swarm.",
      icon: TrendingUp,
    },
    {
      title: "Recruiter Access",
      description: "Reverse recruiting where employers apply to talk to you.",
      icon: UserCheck,
    },
  ];

  const unlockSteps = [
    {
      step: "1",
      title: "Complete Assessment",
      desc: "Discover your baseline score and target role level.",
    },
    {
      step: "2",
      title: "Finish Personalized Roadmap",
      desc: "Master AI skills through daily verified tasks.",
    },
    {
      step: "3",
      title: "Build AI Projects",
      desc: "Publish verified capstones in the AI Lab.",
    },
    {
      step: "4",
      title: "Reach Talent Score 850",
      desc: "Become a certified Production Ready Engineer.",
    },
  ];

  const faqItems = [
    {
      question: "What is Network?",
      answer:
        "Network is an exclusive AI Talent Marketplace and reverse-recruiting platform available only to Production Ready Engineers. Unlike open job boards, every employer and opportunity is vetted, and every engineer has proven their skills through verified code and assessment scores.",
    },
    {
      question: "Who gets access?",
      answer:
        "Access is strictly reserved for students who reach a Talent Score of 850 or higher, complete their core AI roadmap, publish verified GitHub portfolio projects, and pass technical verification.",
    },
    {
      question: "How is Production Ready calculated?",
      answer:
        "Your Production Ready status is determined by your CalibiAI Talent Score (0–1000), which evaluates four core pillars: Core Curriculum Completion, AI Lab Mini-Project verification, Assessment & Technical Interview accuracy, and Community Code Review contributions.",
    },
    {
      question: "How are projects assigned?",
      answer:
        "Once unlocked, you gain direct access to browse and submit proposals on verified freelance gigs, or get matched automatically by CalibiAI's Talent Engine for exclusive client automation requests based on your verified skill graph.",
    },
    {
      question: "Can anyone join?",
      answer:
        "No. Network is not an open community or general job board. It is a gated, merit-based talent marketplace designed to protect client quality and ensure our top engineers receive premium compensation without competing against spam proposals.",
    },
    {
      question: "How much can engineers earn?",
      answer:
        "Top Production Ready Engineers inside Network earn up to ₹3.2L per month on freelance projects and client retainers, with average monthly earnings of ₹42,000 for active contributors. Verified full-time job placements range from ₹12 LPA to ₹36+ LPA.",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#05060A] text-slate-800 dark:text-slate-100 selection:bg-emerald-500 selection:text-white dark:selection:text-slate-950">
      {/* Ambient Floating Gradient Lights */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[650px] w-[950px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-400/25 via-sky-400/15 to-teal-400/25 opacity-60 blur-[130px] dark:from-emerald-500/10 dark:via-sky-500/5 dark:to-teal-500/10 dark:opacity-70" />
      <div className="pointer-events-none absolute right-[-20%] top-[45%] -z-10 h-[500px] w-[500px] rounded-full bg-emerald-400/20 opacity-50 blur-[140px] dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute left-[-15%] top-[70%] -z-10 h-[500px] w-[500px] rounded-full bg-teal-400/20 opacity-40 blur-[140px] dark:bg-teal-500/10" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ====================================================
            TOP HERO SECTION
        ==================================================== */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-900/[0.10] dark:border-white/[0.12] bg-gradient-to-b from-white/80 via-white/50 to-transparent dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent p-8 text-center shadow-lg shadow-slate-900/[0.06] dark:shadow-2xl dark:shadow-black/40 backdrop-blur-2xl sm:p-14">
          {/* Subtle mesh background accent */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent opacity-60" />

          {/* Large animated lock */}
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-600/30 dark:border-emerald-500/30 bg-gradient-to-b from-emerald-400/25 to-emerald-500/10 dark:from-emerald-400/20 dark:to-emerald-500/5 text-emerald-700 dark:text-emerald-400 shadow-[0_0_50px_-10px_rgba(16,185,129,0.6)]">
            <Lock className="h-12 w-12 animate-pulse" />
            <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950 shadow-md">
              🔒
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-8 text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
            Network
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-base font-normal leading-relaxed text-slate-600 dark:text-slate-300/90 sm:text-lg">
            Welcome to CalibiAI Network.
            <br />
            This is an exclusive marketplace reserved only for Production Ready AI Engineers.
            <br />
            <span className="text-slate-600 dark:text-slate-400">
              Unlock verified jobs, premium freelance opportunities, AI client projects and direct hiring from partner companies.
            </span>
          </p>

          {/* Glass badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/35 dark:border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)]">
              <Lock className="h-3.5 w-3.5" /> LOCKED
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/[0.10] dark:border-white/15 bg-white/60 dark:bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-800 dark:text-white/90 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> Production Ready Required
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/[0.10] dark:border-white/15 bg-white/60 dark:bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-800 dark:text-white/90 backdrop-blur-md">
              <Target className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Required Talent Score • 850
            </span>
          </div>
        </section>

        {/* ====================================================
            LIVE PROGRESS
        ==================================================== */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-900/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-6 shadow-lg shadow-slate-900/[0.06] dark:shadow-2xl dark:shadow-black/40 backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            {/* Circular progress component */}
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
                  {/* Background track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-900"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Animated Progress arc */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    className="stroke-emerald-600 transition-all duration-1000 ease-out dark:stroke-emerald-400"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{
                      filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {currentScore}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">/ 1000</span>
                  <span className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    TALENT SCORE
                  </span>
                </div>
              </div>

              <div>
                <span className="inline-block rounded-full border border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Live Audit Status
                </span>
                <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  {remainingScore > 0
                    ? `${remainingScore} Points to Unlock Network`
                    : "You are Production Ready!"}
                </h2>
                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                  {isSignedIn
                    ? "Keep progressing through your daily roadmap and AI Lab verifications to qualify for exclusive talent placements."
                    : "Sign in to see your live Talent Score, roadmap progress and personalized unlock checklist."}
                </p>
              </div>
            </div>

            {/* Below / beside metrics bar */}
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
              <div className="rounded-2xl border border-slate-900/[0.07] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] p-4 text-center backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Current
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{currentScore}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">Talent Score</p>
              </div>

              <div className="rounded-2xl border border-slate-900/[0.07] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] p-4 text-center backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Required
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">{requiredScore}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">Talent Score</p>
              </div>

              <div className="rounded-2xl border border-slate-900/[0.07] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] p-4 text-center backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Remaining
                </p>
                <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">{remainingScore}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">Points to earn</p>
              </div>

              <div className="rounded-2xl border border-slate-900/[0.07] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] p-4 text-center backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 dark:text-slate-400">
                  Estimated Time
                </p>
                <p className="mt-1 text-2xl font-black text-sky-600 dark:text-sky-400">
                  {estimatedDaysToUnlock} Days
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500 dark:text-slate-500">
                  {remainingRoadmapDays} roadmap + {NON_ROADMAP_BUFFER_DAYS} activity
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            UNLOCK CHECKLIST
        ==================================================== */}
        <section className="mt-8 rounded-3xl border border-slate-900/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-6 shadow-lg shadow-slate-900/[0.06] dark:shadow-2xl dark:shadow-black/40 backdrop-blur-xl sm:p-10">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Requirements
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Unlock Checklist
              </h2>
            </div>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-500 dark:text-slate-400">
              {completedRequirements} of {totalRequirements} requirements completed
            </span>
          </div>

          <div className="mt-8 space-y-3">
            {checklistItems.map((item, index) => {
              const Icon = item.icon;
              const isCompleted = item.status === "completed";
              const isPending = item.status === "pending";
              const isLocked = item.status === "locked";

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-all duration-300 sm:flex-row sm:items-center ${
                    isCompleted
                      ? "border-emerald-600/35 bg-emerald-50/80 shadow-[0_0_25px_-12px_rgba(16,185,129,0.35)] hover:border-emerald-600/55 dark:border-emerald-500/40 dark:bg-emerald-950/20 dark:shadow-[0_0_25px_-10px_rgba(16,185,129,0.4)] dark:hover:border-emerald-500/60"
                      : isPending
                        ? "border-slate-900/[0.08] bg-white/70 hover:border-slate-900/20 hover:bg-white/90 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]"
                        : "border-slate-900/[0.06] bg-white/50 opacity-70 hover:opacity-90 dark:border-white/5 dark:bg-white/[0.01] dark:opacity-60 dark:hover:opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-all ${
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-700 shadow-[0_0_15px_-5px_rgba(16,185,129,0.45)] dark:bg-emerald-500/20 dark:text-emerald-400 dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]"
                          : isPending
                            ? "bg-slate-900/[0.06] text-slate-900 dark:bg-white/10 dark:text-white"
                            : "bg-white/60 text-slate-500 dark:bg-white/5 dark:text-slate-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">
                          #{index + 1}
                        </span>
                        <h3
                          className={`font-bold sm:text-lg ${
                            isCompleted ? "text-emerald-800 dark:text-emerald-300" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <p
                        className={`mt-1 text-sm ${
                          isLocked ? "text-slate-400 blur-[0.3px] dark:text-slate-500" : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 sm:text-right">
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/35 dark:border-emerald-500/40 bg-emerald-500/15 dark:bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_-3px_rgba(16,185,129,0.5)]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/[0.10] dark:border-white/15 bg-white/60 dark:bg-white/5 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Pending
                      </span>
                    )}
                    {isLocked && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/[0.06] dark:border-white/5 bg-white/60 dark:bg-white/5 px-3.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-500">
                        <Lock className="h-3.5 w-3.5" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================
            NOW THE MOST IMPORTANT SECTION — INSIDE NETWORK
            "Instead of hiding everything, show users what they are missing.
             Everything should be visible BUT Blurred, Dimmed, Glass overlay, Lock icons."
        ==================================================== */}
        <section className="mt-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Lock className="h-3.5 w-3.5" /> Inside Network
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              What You&apos;re Missing
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-base text-slate-600 dark:text-slate-400">
              Here&apos;s what becomes available after becoming a Production Ready Engineer.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => {
              const CardIcon = card.icon;

              return (
                <div
                  key={card.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-6 shadow-md shadow-slate-900/[0.05] dark:shadow-xl dark:shadow-black/30 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-600/10 dark:hover:shadow-2xl dark:hover:shadow-emerald-950/20"
                >
                  {/* Blurred card value */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800 dark:text-white/90">🔒 {card.title}</p>
                      <CardIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400 opacity-60" />
                    </div>

                    <div className="relative mt-4">
                      {/* Blurred Value background */}
                      <p className="select-none text-4xl font-black tracking-tight text-slate-900 dark:text-white opacity-40 blur-[5px] transition-all duration-300 group-hover:opacity-50">
                        {card.value}
                      </p>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {card.description}
                    </p>
                  </div>

                  {/* Glass overlay with lock button */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 dark:bg-slate-950/45 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-white/40 dark:group-hover:bg-slate-950/30">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/[0.10] dark:border-white/15 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-xl transition-all duration-300 group-hover:border-emerald-500/40 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 group-hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]">
                      <Lock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> Unlock Network to View
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================
            MARKETPLACE PREVIEW
        ==================================================== */}
        <section className="mt-16">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Opportunities Preview
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Marketplace Preview
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Verified jobs, freelance contracts, and exclusive client AI services currently live.
              </p>
            </div>

            <span className="rounded-full border border-slate-900/[0.08] dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              🔒 64+ live opportunities locked
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {marketplaceOpportunities.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-6 shadow-md shadow-slate-900/[0.05] dark:shadow-xl dark:shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40"
              >
                {/* Category tag */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-slate-900/[0.08] dark:border-white/10 bg-white/60 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">
                    {item.location}
                  </span>
                </div>

                {/* Content (dimmed / blurred) */}
                <div className="mt-4 select-none opacity-60 blur-[3px]">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.company}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-900/[0.06] dark:border-white/5 pt-4">
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                      {item.compensation}
                    </span>
                    <span className="rounded bg-slate-900/[0.06] dark:bg-white/10 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                      {item.type}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/60 dark:bg-white/5 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Glass Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/45 dark:bg-slate-950/35 backdrop-blur-[1px] transition-all duration-300 group-hover:bg-white/30 dark:group-hover:bg-slate-950/25">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/35 dark:border-emerald-500/40 bg-white/95 dark:bg-slate-950/95 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shadow-lg shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/50 transition-all group-hover:border-emerald-500 group-hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)]">
                      <Lock className="h-3.5 w-3.5" /> LOCKED • SCORE 850+
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================
            TOP ENGINEERS PREVIEW
        ==================================================== */}
        <section className="mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Talent Leaderboard
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Top Engineers Preview
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Production Ready Engineers actively completing projects and earning monthly inside the Network.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-900/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] shadow-lg shadow-slate-900/[0.06] dark:shadow-2xl dark:shadow-black/40 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-900/[0.08] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Engineer</th>
                    <th className="px-6 py-4">Talent Score</th>
                    <th className="px-6 py-4">Projects</th>
                    <th className="px-6 py-4">Monthly Earnings</th>
                    <th className="px-6 py-4">Verification Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/[0.06] dark:divide-white/5">
                  {topEngineers.map((eng) => (
                    <tr
                      key={eng.rank}
                      className="transition-colors hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4 font-black text-slate-600 dark:text-slate-400">
                        #{eng.rank}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Blurred avatar */}
                          <div
                            className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-br ${eng.avatarBg} opacity-70 blur-[4px]`}
                          />
                          {/* Blurred name */}
                          <span className="select-none font-bold text-slate-900 dark:text-white opacity-75 blur-[3px]">
                            {eng.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-1 font-black text-emerald-700 dark:text-emerald-400">
                          {eng.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                        {eng.projects}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {eng.earnings}
                      </td>
                      <td className="px-6 py-4 font-semibold text-amber-600 dark:text-amber-400">
                        {eng.rating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leaderboard footer */}
            <div className="border-t border-slate-900/[0.08] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-4 text-center">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                <Lock className="h-4 w-4" /> Unlock to Join Top Engineers
              </span>
            </div>
          </div>
        </section>

        {/* ====================================================
            WHY NETWORK MATTERS
        ==================================================== */}
        <section className="mt-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Value Proposition
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Why Network Matters
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              An exclusive professional club designed to elevate your AI engineering career from learner to industry leader.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyNetworkMatters.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div
                  key={index}
                  className="group rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-white/90 dark:hover:bg-white/[0.05]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 transition-all group-hover:bg-emerald-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================
            HOW TO UNLOCK
        ==================================================== */}
        <section className="mt-16 rounded-3xl border border-slate-900/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] p-8 shadow-lg shadow-slate-900/[0.06] dark:shadow-2xl dark:shadow-black/40 backdrop-blur-xl sm:p-12">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Clear Roadmap
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              How to Unlock
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Follow the 4-step path from your initial assessment to joining the CalibiAI Network.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {unlockSteps.map((s, idx) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-slate-900/[0.08] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-6 text-center transition-all hover:border-slate-900/20 dark:hover:border-white/20"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15 font-black text-emerald-700 dark:text-emerald-400">
                  {s.step}
                </div>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{s.desc}</p>

                {/* Step arrow connector for lg screens */}
                {idx < 3 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-slate-400 dark:text-slate-600 lg:block">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/35 dark:border-emerald-500/40 bg-gradient-to-r from-emerald-100 via-emerald-50 to-teal-100 dark:from-emerald-950/60 dark:via-emerald-900/40 dark:to-teal-950/60 px-6 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)]">
              <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              Production Ready Engineer → Network Unlocked
            </span>
          </div>
        </section>

        {/* ====================================================
            CALL TO ACTION (CTA)
        ==================================================== */}
        <section className="mt-16 relative overflow-hidden rounded-3xl border border-emerald-600/30 dark:border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/40 dark:via-slate-900/80 dark:to-emerald-950/40 p-10 text-center shadow-lg shadow-slate-900/[0.06] dark:shadow-2xl dark:shadow-black/40 backdrop-blur-2xl sm:p-14">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-60" />

          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Become Production Ready.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600 dark:text-slate-300">
            Complete your roadmap, improve your Talent Score and unlock the CalibiAI Network.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:shadow-emerald-500/30 dark:hover:bg-emerald-400 dark:hover:shadow-emerald-500/50"
            >
              Continue Learning <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/learning-hub"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-900/[0.12] dark:border-white/15 bg-white/80 dark:bg-white/5 px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white transition-all hover:bg-white dark:hover:bg-white/10"
            >
              Explore Curriculum
            </Link>
          </div>
        </section>

        {/* ====================================================
            FAQ (PREMIUM ACCORDION)
        ==================================================== */}
        <section className="mt-16 pb-12">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Questions & Answers
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Everything you need to know about access, verification, and marketplace opportunities.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl divide-y divide-slate-900/[0.08] dark:divide-white/10 rounded-2xl border border-slate-900/[0.08] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] px-6 backdrop-blur-xl">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <div key={index} className="py-5">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between text-left font-bold text-slate-900 dark:text-white transition-colors hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    <span className="text-base sm:text-lg">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-emerald-700 dark:text-emerald-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300/90 sm:text-base">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
