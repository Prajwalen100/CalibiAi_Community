import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Code2,
  Database,
  ExternalLink,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  Github,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Lock,
  PlayCircle,
  RefreshCcw,
  Route,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy,
  Users,
  Workflow,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  ADMIN_QUEUES,
  AI_AGENTS,
  DEMO_LEARNERS,
  SUCCESS_METRICS,
  TALENT_SCORE_COMPONENTS,
  USER_JOURNEY,
  getLearningEngineAdminData,
  type AssessmentSummary,
  type HealthTone,
  type LearningEngineAdminData,
  type RoadmapSummary,
  type RoleDefinition,
} from "../_lib/learning-engine-admin-data";
import { BlogPostManager } from "../_components/blog-post-manager";
import { getAdminBlogPosts, type AdminBlogPostsResult } from "../_lib/blog-posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Portal — CalibiAI Learning Engine",
  description: "Standalone testing portal for administering the CalibiAI Personalized Learning Engine.",
};

type PageProps = {
  params: Promise<{ section?: string[] }>;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "overview",
    label: "Command Center",
    href: "/admin",
    description: "KPI, workflow and role readiness",
    icon: LayoutDashboard,
  },
  {
    key: "content",
    label: "Content Ops",
    href: "/admin/content",
    description: "Assessment and roadmap JSON audit",
    icon: BookOpenCheck,
  },
  {
    key: "learners",
    label: "Learners",
    href: "/admin/learners",
    description: "Onboarding, missions and progress queues",
    icon: Users,
  },
  {
    key: "blog",
    label: "Blog CMS",
    href: "/admin/blog",
    description: "Create, review and publish posts",
    icon: FileText,
  },
  {
    key: "reviews",
    label: "AI & Reviews",
    href: "/admin/reviews",
    description: "Bedrock guardrails and weekly reviews",
    icon: BrainCircuit,
  },
  {
    key: "settings",
    label: "System Map",
    href: "/admin/settings",
    description: "APIs, DB tables and scoring rules",
    icon: Settings2,
  },
  {
    key: "spec",
    label: "PDF Extract",
    href: "/admin/spec",
    description: "Detailed requirements extracted from the PDF",
    icon: FileText,
  },
];

const statusStyles: Record<HealthTone, string> = {
  ok: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  warn: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  danger: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  info: "border-sky-400/40 bg-sky-400/10 text-sky-200",
};

const statusIcon: Record<HealthTone, LucideIcon> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  danger: XCircle,
  info: Activity,
};

const sectionHeadings: Record<string, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Admin command center",
    title: "Learning Engine control room",
    description:
      "A standalone /admin portal built from the PDF specification. It audits the committed JSON knowledge base and gives operators a test console without touching the rest of the site.",
  },
  content: {
    eyebrow: "Content operations",
    title: "JSON knowledge base audit",
    description:
      "Verify role bindings, assessment-bank contracts, 45-day roadmaps, resource coverage, and immutable content rules from the implementation spec.",
  },
  learners: {
    eyebrow: "Learner operations",
    title: "Onboarding, mission and risk queues",
    description:
      "Testing dashboard for the learner lifecycle: onboarding, placement, active mission, roadmap progress, Talent Score and weekly review readiness.",
  },
  blog: {
    eyebrow: "Blog operations",
    title: "Supabase-backed blog posting",
    description:
      "Create drafts, submit posts for review and publish admin-approved articles into the public /blog experience.",
  },
  reviews: {
    eyebrow: "AI operations",
    title: "Bedrock agents and weekly review safety",
    description:
      "Monitor the seven stateless agents, strict JSON contracts, deterministic fallbacks and the weekly adaptation loop described in the PDF.",
  },
  settings: {
    eyebrow: "System map",
    title: "API, data and scoring contracts",
    description:
      "One place for admins to inspect the endpoint catalog, Supabase table model, Talent Score formula and required operational invariants.",
  },
  spec: {
    eyebrow: "Extracted from PDF",
    title: "Detailed implementation brief",
    description:
      "The source document distilled into admin-facing requirements, acceptance gates, role mappings and sequencing rules.",
  },
};

export default async function AdminPortalPage({ params }: PageProps) {
  const { section = [] } = await params;
  const requestedSection = section[0] ?? "overview";
  const activeSection = NAV_ITEMS.some((item) => item.key === requestedSection) ? requestedSection : "overview";
  const data = await getLearningEngineAdminData();
  const blogData = activeSection === "blog" ? await getAdminBlogPosts() : null;

  return (
    <AdminShell activeSection={activeSection} data={data}>
      {activeSection === "overview" && <OverviewSection data={data} />}
      {activeSection === "content" && <ContentSection data={data} />}
      {activeSection === "learners" && <LearnersSection data={data} />}
      {activeSection === "blog" && blogData && <BlogSection blogData={blogData} />}
      {activeSection === "reviews" && <ReviewsSection data={data} />}
      {activeSection === "settings" && <SettingsSection data={data} />}
      {activeSection === "spec" && <SpecSection data={data} />}
    </AdminShell>
  );
}

function AdminShell({
  activeSection,
  data,
  children,
}: {
  activeSection: string;
  data: LearningEngineAdminData;
  children: React.ReactNode;
}) {
  const heading = sectionHeadings[activeSection] ?? sectionHeadings.overview;
  const activeNav = NAV_ITEMS.find((item) => item.key === activeSection) ?? NAV_ITEMS[0];
  const ActiveIcon = activeNav.icon;

  return (
    <div
      id="calibiai-admin-portal"
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950 text-white antialiased"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-15%] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-8%] h-[34rem] w-[34rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative min-h-screen lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-slate-950/85 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:p-5">
          <Link href="/admin" className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.07]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-violet-500 shadow-lg shadow-blue-950/50">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">CalibiAI Admin</p>
              <p className="text-xs text-slate-400">Learning Engine / test mode</p>
            </div>
          </Link>

          <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs text-sky-100">
            <p className="font-bold">Standalone portal</p>
            <p className="mt-1 leading-relaxed text-sky-100/80">
              Accessible at <span className="font-mono">/admin</span>. Read-only prototype built from {data.spec.sourceFile}.
            </p>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeSection;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group flex min-w-[210px] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition lg:min-w-0 ${
                    isActive
                      ? "border-brand-300/40 bg-brand-400/15 text-white shadow-lg shadow-blue-950/25"
                      : "border-white/5 bg-white/[0.025] text-slate-300 hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isActive ? "bg-brand-400 text-slate-950" : "bg-white/5 text-slate-300 group-hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="hidden text-xs leading-4 text-slate-400 lg:block">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Content totals</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <MiniStat value={data.totals.assessmentQuestions} label="questions" />
              <MiniStat value={data.totals.roadmapDays} label="days" />
              <MiniStat value={data.totals.resourceLinks} label="links" />
              <MiniStat value={data.totals.projects} label="projects" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-200">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-200">{heading.eyebrow}</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{heading.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{heading.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusPill status="ok" label="Read-only" />
              <StatusPill status="info" label={`Generated ${formatDateTime(data.generatedAt)}`} />
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

function OverviewSection({ data }: { data: LearningEngineAdminData }) {
  const apiReady = data.repositoryStatus.apiRoutes.filter((route) => route.present).length;
  const tableReady = data.repositoryStatus.databaseTables.filter((table) => table.present).length;
  const rolesReady = data.readiness.filter((role) => role.status === "ok").length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-slate-950/30">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-400/10 px-3 py-1 text-xs font-bold text-brand-100">
              <Sparkles className="h-3.5 w-3.5" /> Extracted from {data.spec.sourceFile}
            </div>
            <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              Admin portal for the Personalized Learning Engine.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              {data.spec.scope} The portal is separated at <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">localhost:3000/admin</span> for testing and does not change learner-facing flows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/content" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-brand-100">
                Audit content JSON <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/spec" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                View PDF extract <FileText className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="border-t border-white/10 bg-slate-900/50 p-6 lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Spec constants</p>
            <div className="mt-4 space-y-3">
              <SpecFact icon={Server} label="Stack" value={data.spec.stack} />
              <SpecFact icon={Route} label="Roadmaps" value="Eight 45-day JSON files: beginner + intermediate for four roles" />
              <SpecFact icon={ClipboardCheck} label="Assessment" value="Four 100-question banks; runtime placement uses 20 questions" />
              <SpecFact icon={Bot} label="AI boundary" value="Bedrock personalizes only; it never authors curriculum or scores tests" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={GraduationCap} label="Roles ready" value={`${rolesReady}/${data.totals.roles}`} detail="Role mappings with assessment + beginner/intermediate roadmaps" tone="ok" />
        <MetricCard icon={ClipboardCheck} label="Assessment bank" value={formatNumber(data.totals.assessmentQuestions)} detail={`${data.totals.generatedAssessmentQuestions} questions served per full role cohort attempt`} tone="info" />
        <MetricCard icon={Route} label="Roadmap days" value={formatNumber(data.totals.roadmapDays)} detail={`${data.totals.roadmapFiles} files × 45 days from immutable JSON`} tone="ok" />
        <MetricCard icon={Database} label="Repo contracts" value={`${apiReady + tableReady}/${data.repositoryStatus.apiRoutes.length + data.repositoryStatus.databaseTables.length}`} detail="API files and Supabase tables detected for the spec map" tone="warn" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard title="User journey extracted from the PDF" icon={Workflow} description="The admin portal keeps this journey visible so future live metrics can map to each engine stage.">
          <ol className="space-y-3">
            {USER_JOURNEY.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-400 text-xs font-black text-slate-950">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard title="Success metrics" icon={Gauge} description="Operational targets from Chapter 1 of the PDF.">
          <div className="space-y-3">
            {SUCCESS_METRICS.map((metric) => (
              <div key={metric.metric} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{metric.metric}</p>
                    <p className="mt-1 text-sm text-slate-400">{metric.detail}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">{metric.target}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <RoleReadinessGrid readiness={data.readiness} />
    </div>
  );
}

function ContentSection({ data }: { data: LearningEngineAdminData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClipboardCheck} label="Assessment banks" value={`${data.totals.assessmentBanks}/4`} detail="One 100-question bank per role" tone="ok" />
        <MetricCard icon={ListChecks} label="Question contract" value="2 × 10" detail="Runtime test selects two questions per skill" tone="info" />
        <MetricCard icon={Route} label="Roadmap files" value={`${data.totals.roadmapFiles}/8`} detail="Beginner + intermediate for four roles" tone="ok" />
        <MetricCard icon={BookOpenCheck} label="Learning assets" value={formatNumber(data.totals.resourceLinks)} detail="Videos, docs, GitHub repos and papers" tone="info" />
      </div>

      <GlassCard title="Role to file resolver" icon={GitBranch} description="Exact mapping required by the PDF. The Data Science intermediate misspelling is intentional and preserved.">
        <div className="grid gap-4 lg:grid-cols-2">
          {data.roles.map((role) => (
            <div key={role.key} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${role.accent}`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-white">{role.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{role.description}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <FilePath label="Assessment" value={`content/assessment/${role.assessmentFile}`} />
                <FilePath label="Beginner" value={`content/roadmap/${role.roadmapFiles.beginner}`} />
                <FilePath label="Intermediate" value={`content/roadmap/${role.roadmapFiles.intermediate}`} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard title="Assessment bank audit" icon={ClipboardCheck} description="All banks should be 100 questions, 10 skills, 10 questions per skill, 70/30 Easy/Medium, with 0-based answer indexes.">
          <div className="space-y-4">
            {data.assessments.map((assessment) => (
              <AssessmentAuditCard key={assessment.fileName} assessment={assessment} />
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Roadmap matrix" icon={Route} description="Each role has beginner and intermediate tracks. Days are immutable content; personalization is stored as overlay references.">
          <div className="space-y-4">
            {data.roles.map((role) => {
              const roadmaps = data.roadmaps.filter((roadmap) => roadmap.role.key === role.key);
              return <RoadmapRoleCard key={role.key} role={role} roadmaps={roadmaps} />;
            })}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Immutable JSON standards" icon={Lock} description="Admin rulebook for safe content operations in testing and production.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RuleCard title="Never mutate source JSON" detail="Assignments pin file/version hashes. Personalization lives in Supabase overlay rows." />
          <RuleCard title="No AI-authored curriculum" detail="Bedrock can recommend order and focus, but cannot invent questions, projects, days or links." />
          <RuleCard title="Reveal answers server-side" detail="correct_answer and explanation are returned only after /api/assessment/answer validates a click." />
          <RuleCard title="Fallback always works" detail="Invalid overlay or Bedrock outage discards AI output and keeps the raw roadmap order." />
        </div>
      </GlassCard>
    </div>
  );
}

function LearnersSection({ data }: { data: LearningEngineAdminData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Demo learners" value={DEMO_LEARNERS.length} detail="Static sandbox data for portal testing" tone="info" />
        <MetricCard icon={Flame} label="Avg streak" value="3.8" detail="Prototype calculation from sample queue" tone="ok" />
        <MetricCard icon={Trophy} label="Avg Talent Score" value="415" detail="0-1000 deterministic score model" tone="warn" />
        <MetricCard icon={TimerReset} label="Review cadence" value="7 days" detail="Weekly Review eligibility after active learning days" tone="info" />
      </div>

      <GlassCard title="Operations queues" icon={Activity} description="Testing queues mirror the PDF lifecycle. Wire these to Supabase aggregates when production admin auth is added.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ADMIN_QUEUES.map((queue) => (
            <div key={queue.label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">{queue.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{queue.detail}</p>
                </div>
                <StatusPill status={queue.tone as HealthTone} label={String(queue.count)} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <GlassCard title="Learner lifecycle board" icon={Users} description="Sample rows show the shape of an admin roster without requiring any writes or service-role access.">
          <div className="space-y-3">
            {DEMO_LEARNERS.map((learner) => (
              <div key={learner.name} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-white">{learner.name}</h3>
                      <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold text-slate-300">{learner.role}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{learner.stage}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {learner.focus.map((focus) => (
                        <span key={focus} className="rounded-full border border-brand-300/20 bg-brand-400/10 px-2.5 py-1 text-xs font-semibold text-brand-100">
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid min-w-[220px] gap-3 text-sm sm:grid-cols-3 md:text-right">
                    <SmallMeter label="Talent" value={learner.talent} max={1000} />
                    <SmallMeter label="Roadmap" value={learner.roadmapPct} max={100} suffix="%" />
                    <div>
                      <p className="text-xl font-black text-white">{learner.streak}</p>
                      <p className="text-xs text-slate-400">day streak</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-950/35 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-slate-300"><span className="font-bold text-white">Next admin action:</span> {learner.nextAction}</span>
                  <StatusPill status={statusForLearner(learner.status)} label={learner.status} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Daily mission decomposition" icon={PlayCircle} description="The PDF defines Today's Mission as watch → read → quiz → assignment/practical → commit/project.">
          <div className="space-y-3">
            {[
              { type: "video", source: "youtube[]", xp: "10 XP", required: true },
              { type: "article", source: "official_docs[] / article", xp: "10 XP", required: true },
              { type: "quiz", source: "day.quiz", xp: "20 XP", required: true },
              { type: "assignment", source: "assignment / practical_task", xp: "30 XP", required: true },
              { type: "project", source: "mini_project", xp: "100 XP", required: false },
              { type: "commit", source: "GitHub sync", xp: "15 XP", required: false },
            ].map((task) => (
              <div key={task.type} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <div>
                  <p className="font-bold capitalize text-white">{task.type}</p>
                  <p className="text-xs text-slate-400">Source: {task.source}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold text-slate-300">{task.xp}</span>
                  <StatusPill status={task.required ? "ok" : "info"} label={task.required ? "required" : "bonus"} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Role readiness snapshot" icon={GraduationCap} description="Learner assignment uses these exact content families.">
        <RoleReadinessGrid readiness={data.readiness} compact />
      </GlassCard>
    </div>
  );
}

function BlogSection({ blogData }: { blogData: AdminBlogPostsResult }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FileText} label="CMS table" value="posts" detail="Blog content is stored in Supabase public.posts with type=blog" tone="ok" />
        <MetricCard icon={ShieldCheck} label="Write roles" value="author/admin" detail="RLS and API routes enforce posting permissions" tone="ok" />
        <MetricCard icon={CheckCircle2} label="Review states" value="3" detail="draft, in_review and published" tone="info" />
        <MetricCard icon={ExternalLink} label="Public route" value="/blog/[slug]" detail="Published posts appear on the public blog" tone="info" />
      </div>

      <GlassCard
        title="Blog posting workflow"
        icon={FileText}
        description="Create and publish CMS-backed articles without changing the community or learning-engine content JSON. Authors can draft/submit; admins can publish."
      >
        <BlogPostManager initial={blogData} />
      </GlassCard>

      <GlassCard title="Supabase schema maintained" icon={Database} description="The new migration extends the existing posts table instead of creating a duplicate blog system.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RuleCard title="Metadata columns" detail="slug, excerpt, category, read_time_minutes, cover_image_url, tags, meta fields and featured flag." />
          <RuleCard title="Stable public URLs" detail="A partial unique index protects blog slugs for type=blog rows." />
          <RuleCard title="Existing RLS reused" detail="public.current_user_role() gates author/admin writes and public published reads." />
          <RuleCard title="Public read view" detail="published_blog_posts exposes only published blog fields while table RLS remains authoritative." />
        </div>
      </GlassCard>
    </div>
  );
}

function ReviewsSection({ data }: { data: LearningEngineAdminData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Bot} label="Agents" value={AI_AGENTS.length} detail="All stateless and gateway-mediated" tone="info" />
        <MetricCard icon={RefreshCcw} label="Review cadence" value="7 active days" detail="Idempotent per user/week_index" tone="ok" />
        <MetricCard icon={ShieldCheck} label="Output contract" value="Strict JSON" detail="Schema validation + repair + fallback" tone="ok" />
        <MetricCard icon={Clock3} label="Async model" value="Non-blocking" detail="UI reads persisted rows, never waits on Bedrock" tone="info" />
      </div>

      <GlassCard title="Bedrock responsibility boundary" icon={ShieldCheck} description="The admin portal highlights this because it is the most important safety constraint in the PDF.">
        <div className="grid gap-4 lg:grid-cols-3">
          <RuleCard title="Personalizes" detail="Roadmap overlays, weekly narrative, daily motivation, project feedback and next recommendations." />
          <RuleCard title="Never authors" detail="No generated questions, days, projects, articles, videos, papers or authoritative score changes." />
          <RuleCard title="Always validated" detail="Every output must match schema and reference existing day numbers/content ids before persistence." />
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard title="Seven AI agents" icon={BrainCircuit} description="All agents call a single server-only gateway with cache keys, low temperature and deterministic fallbacks.">
          <div className="grid gap-4 md:grid-cols-2">
            {AI_AGENTS.map((agent, index) => (
              <div key={agent.name} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-100">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-black text-white">{agent.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{agent.purpose}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                  <span className="font-bold">Fallback:</span> {agent.fallback}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Weekly review lifecycle" icon={TimerReset} description="Operational flow for Chapter 9 reviews.">
          <ol className="space-y-3">
            {[
              "Scan eligible users by timezone bucket after >=7 active days.",
              "Assemble compact weekly stats, weak/strong skills, missed topics and Talent Score delta.",
              "Invoke Weekly Review Agent through the gateway with strict JSON schema.",
              "Validate roadmap_updates against the assigned 45-day roadmap and prerequisites.",
              "Merge only future-day overlay changes, set last_review_at and keep completed progress intact.",
              "On malformed JSON or AI outage, store lite review with ai_enriched=false and retry later.",
            ].map((item, index) => (
              <li key={item} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-400 text-xs font-black text-slate-950">{index + 1}</span>
                <span className="text-sm leading-6 text-slate-300">{item}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
            <div className="border-b border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Expected strict JSON</div>
            <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-300">{`{
  "summary": "2-3 sentence recap",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": [
    { "text": "...", "skill": "RAG", "action": "reinforce" }
  ],
  "roadmap_updates": {
    "reinforce_days": [30, 31],
    "compress_days": [14],
    "resequence": [1, 2, 3]
  },
  "motivation": "1-2 sentences"
}`}</pre>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Content reference validation" icon={Search} description="AI suggestions are only accepted when they reference the audited files below.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.roles.map((role) => (
            <div key={role.key} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${role.accent}`} />
              <h3 className="mt-4 font-black text-white">{role.label}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">Valid references must map to this role&apos;s assessment bank and its two 45-day roadmap files.</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function SettingsSection({ data }: { data: LearningEngineAdminData }) {
  const apiPresent = data.repositoryStatus.apiRoutes.filter((route) => route.present).length;
  const tablePresent = data.repositoryStatus.databaseTables.filter((table) => table.present).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Code2} label="API files detected" value={`${apiPresent}/${data.repositoryStatus.apiRoutes.length}`} detail="Compared to the PDF endpoint catalog" tone="warn" />
        <MetricCard icon={Database} label="Tables referenced" value={`${tablePresent}/${data.repositoryStatus.databaseTables.length}`} detail={`${data.repositoryStatus.migrationsCount} SQL migration files scanned`} tone="warn" />
        <MetricCard icon={Trophy} label="Talent Score max" value="1000" detail="Deterministic formula, append-versioned rows" tone="ok" />
        <MetricCard icon={ShieldCheck} label="Security model" value="RLS" detail="User-owned rows; service role only for jobs" tone="ok" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard title="API endpoint catalog" icon={Code2} description="Spec routes and their current file-presence status in the repository. Missing items are shown as warnings, not modified by this portal.">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.repositoryStatus.apiRoutes.map((route) => (
                  <tr key={`${route.method}-${route.path}`} className="bg-white/[0.015]">
                    <td className="px-4 py-3"><span className="rounded bg-white/8 px-2 py-1 font-mono text-xs font-bold text-brand-100">{route.method}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{route.path}</td>
                    <td className="px-4 py-3 text-slate-400">{route.owner}</td>
                    <td className="px-4 py-3"><StatusPill status={route.status} label={route.present ? "file present" : "needs build"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard title="Supabase table map" icon={Database} description="Tables from Chapter 12. This scanner checks migration text only; it does not connect to Supabase or perform admin reads.">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.repositoryStatus.databaseTables.map((table) => (
              <div key={table.table} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <div>
                  <p className="font-mono text-sm font-bold text-white">{table.table}</p>
                  <p className="text-xs text-slate-500">{table.owner}</p>
                </div>
                <StatusPill status={table.status} label={table.present ? "seen" : "pending"} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Talent Score configuration" icon={Trophy} description="Chapter 8 formula: all scoring is deterministic and Bedrock may only suggest how to improve it.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TALENT_SCORE_COMPONENTS.map((component) => (
            <div key={component.component} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-white">{component.component}</h3>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">{component.points}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-300 to-brand-400" style={{ width: `${(component.points / 220) * 100}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">{component.formula}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Operational invariants" icon={Lock} description="Admin guardrails before this test portal is connected to production data.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RuleCard title="No user_id from clients" detail="Route handlers derive auth.uid() server-side and RLS enforces ownership." />
          <RuleCard title="Idempotent mutations" detail="Step saves, answer records, task completion and weekly reviews use natural keys and safe retries." />
          <RuleCard title="Service-only jobs" detail="GitHub sync and talent recompute internal routes require a service role or signed job token." />
          <RuleCard title="Prompt injection defense" detail="Content JSON is data, not instructions; model output is validated before UI or DB usage." />
          <RuleCard title="Append history" detail="Talent scores, activity logs and weekly reports preserve trend/audit history." />
          <RuleCard title="Existing modules stay isolated" detail="Community score is consumed read-only; recruiter, LMS and marketing features are not changed." />
        </div>
      </GlassCard>
    </div>
  );
}

function SpecSection({ data }: { data: LearningEngineAdminData }) {
  return (
    <div className="space-y-6">
      <GlassCard title="PDF source summary" icon={FileText} description="Core statements extracted into this admin feature so testing can proceed without touching the rest of the site.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Document</p>
            <h2 className="mt-2 text-2xl font-black text-white">{data.spec.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Version {data.spec.version}. {data.spec.scope}</p>
            <div className="mt-4 space-y-2 text-sm">
              <FilePath label="Source" value={data.spec.sourceFile} />
              <FilePath label="Stack" value={data.spec.stack} />
              <FilePath label="Admin route" value="/admin, /admin/content, /admin/learners, /admin/reviews, /admin/settings, /admin/spec" />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Feature ownership</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
              <li><span className="font-bold text-white">Owns:</span> onboarding, placement assessment, skill scoring, knowledge graph, roadmap assignment, daily missions, progress tracking, Talent Score and weekly review.</li>
              <li><span className="font-bold text-white">Does not own:</span> auth, existing dashboard shell/navigation, community, LMS, recruiter/employer modules or marketing pages.</li>
              <li><span className="font-bold text-white">Admin feature here:</span> a separate testing console; no production writes and no changes to existing feature code.</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard title="Deterministic business logic" icon={Workflow} description="The PDF repeatedly separates deterministic engine behavior from probabilistic AI polish.">
          <div className="space-y-3">
            {[
              { title: "Placement, not certification", detail: "Assessment has no pass/fail; passing_score is null and the result only positions the learner." },
              { title: "Beginner vs Intermediate", detail: "Intermediate requires overall >=70, at least six strong skills and at most one weak skill." },
              { title: "One active roadmap", detail: "Retakes archive old user_roadmaps and preserve history instead of corrupting progress." },
              { title: "Compressed still completes", detail: "Compressed days become fast-review days; they are never silently skipped." },
              { title: "Weekly review is adaptive", detail: "Every seven active days, future overlay actions may change after validation." },
            ].map((rule) => (
              <div key={rule.title} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <p className="font-black text-white">{rule.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{rule.detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Chapter acceptance gates" icon={ClipboardCheck} description="Each PDF chapter ends with an 11-point checklist. The admin portal groups those gates for operational review.">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { chapter: "1-2", title: "Onboarding", detail: "Wizard steps, validation, profile persistence, role choice, GitHub/resume optional connect." },
              { chapter: "3", title: "Assessment", detail: "Seeded 20-question attempts, server-authoritative answer reveal, deterministic scoring." },
              { chapter: "4", title: "Roadmap Assignment", detail: "Role+level file resolver, day expansion, prereq unlock and overlay validation." },
              { chapter: "5-7", title: "Daily Learning", detail: "Dashboard aggregate, mission task generation, progress events, sessions and streaks." },
              { chapter: "8", title: "Talent Score", detail: "1000-point transparent formula, badges, levels, append-versioned history." },
              { chapter: "9-11", title: "AI Loop", detail: "Weekly review, Bedrock gateway, seven agents, schemas, fallbacks and audit logs." },
              { chapter: "12-13", title: "DB + API", detail: "Supabase RLS schema, uniform envelopes, Zod validation, idempotent route handlers." },
              { chapter: "14-16", title: "Structure + Tests", detail: "Folder structure, JSON standards, sequence diagram, E2E and chaos tests." },
            ].map((gate) => (
              <div key={gate.chapter} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <span className="rounded-full bg-brand-400/10 px-3 py-1 text-xs font-black text-brand-100">Chapter {gate.chapter}</span>
                <h3 className="mt-3 font-black text-white">{gate.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{gate.detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="Sequence diagram in words" icon={Route} description="Admin-friendly end-to-end flow from login through the weekly adaptation loop.">
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {USER_JOURNEY.map((step, index) => (
            <li key={step} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-brand-100">{index + 1}</span>
              <p className="mt-3 text-sm leading-6 text-slate-300">{step}</p>
            </li>
          ))}
        </ol>
      </GlassCard>

      <GlassCard title="Content extracted and verified" icon={BookOpenCheck} description="The admin portal reads the repository content files directly at request time.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={ClipboardCheck} label="Assessment JSON" value={formatNumber(data.totals.assessmentQuestions)} detail="Four role banks in content/assessment" tone="ok" />
          <MetricCard icon={Route} label="Roadmap JSON" value={formatNumber(data.totals.roadmapDays)} detail="Eight files in content/roadmap" tone="ok" />
          <MetricCard icon={BookOpenCheck} label="Embedded quizzes" value={formatNumber(data.totals.quizQuestions)} detail="Quiz prompts inside roadmap days" tone="info" />
          <MetricCard icon={Github} label="Projects" value={formatNumber(data.totals.projects)} detail="mini_project entries across roadmaps" tone="info" />
        </div>
      </GlassCard>
    </div>
  );
}

function RoleReadinessGrid({ readiness, compact = false }: { readiness: LearningEngineAdminData["readiness"]; compact?: boolean }) {
  return (
    <GlassCard
      title="Role readiness"
      icon={GraduationCap}
      description="The deterministic resolver must find one assessment bank and two roadmaps for each role."
      flush={compact}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {readiness.map((item) => (
          <div key={item.role.key} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className={`h-1.5 rounded-full bg-gradient-to-r ${item.role.accent}`} />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-white">{item.role.shortLabel}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{item.role.label}</p>
              </div>
              <StatusPill status={item.status} label={item.status === "ok" ? "ready" : "check"} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <MiniStat value={item.skillCount} label="skills" />
              <MiniStat value={item.questionCount} label="questions" />
              <MiniStat value={item.roadmapDays} label="days" />
              <MiniStat value="2" label="levels" />
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <StatusRow label="Assessment" status={item.assessmentStatus} />
              <StatusRow label="Beginner" status={item.beginnerStatus} />
              <StatusRow label="Intermediate" status={item.intermediateStatus} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AssessmentAuditCard({ assessment }: { assessment: AssessmentSummary }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-white">{assessment.role.label}</h3>
            <StatusPill status={assessment.status} label={assessment.status === "ok" ? "valid" : "check"} />
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">{assessment.fileName} · sha {assessment.hash ?? "missing"}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat value={assessment.totalQuestions} label="questions" />
          <MiniStat value={assessment.skillCount} label="skills" />
          <MiniStat value={assessment.generatedAssessmentSize} label="served" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Distribution</p>
          <div className="mt-3 space-y-2">
            {Object.entries(assessment.difficultyCounts).map(([difficulty, count]) => (
              <ProgressLine key={difficulty} label={difficulty} value={count} total={assessment.totalQuestions || 1} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Contract</p>
          <dl className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between gap-3"><dt>Answer reveal</dt><dd className="font-bold text-white">{assessment.answerReveal}</dd></div>
            <div className="flex justify-between gap-3"><dt>Passing score</dt><dd className="font-bold text-white">{assessment.passingScore}</dd></div>
            <div className="flex justify-between gap-3"><dt>Valid answers</dt><dd className="font-bold text-white">{assessment.validAnswerIndexes}/{assessment.totalQuestions}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {assessment.skills.map((skill) => (
          <span key={skill} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function RoadmapRoleCard({ role, roadmaps }: { role: RoleDefinition; roadmaps: RoadmapSummary[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${role.accent}`}>
          <Route className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-white">{role.label}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{role.description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {roadmaps.map((roadmap) => (
          <div key={roadmap.fileName} className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold capitalize text-white">{roadmap.level}</p>
              <StatusPill status={roadmap.status} label={`${roadmap.totalDays} days`} />
            </div>
            <p className="mt-2 font-mono text-[11px] text-slate-500">{roadmap.fileName}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat value={roadmap.resourceTotals.quizQuestions} label="quiz" />
              <MiniStat value={roadmap.resourceTotals.videos} label="videos" />
              <MiniStat value={roadmap.resourceTotals.projects} label="projects" />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Day 1: <span className="text-slate-200">{roadmap.firstDayTitle}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  tone: HealthTone;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-brand-100">
          <Icon className="h-5 w-5" />
        </div>
        <StatusPill status={tone} label={tone === "ok" ? "healthy" : tone === "info" ? "tracked" : tone === "warn" ? "watch" : "urgent"} />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function GlassCard({
  title,
  description,
  icon: Icon,
  children,
  flush = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-xl sm:p-6">
      {!flush && (
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-brand-100">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

function RuleCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function SpecFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-brand-100">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-300">{value}</span>
      </span>
    </div>
  );
}

function StatusPill({ status, label }: { status: HealthTone; label: string }) {
  const Icon = statusIcon[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusStyles[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function StatusRow({ label, status }: { label: string; status: HealthTone }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/35 px-3 py-2">
      <span className="font-semibold text-slate-400">{label}</span>
      <StatusPill status={status} label={status === "ok" ? "ok" : status} />
    </div>
  );
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-3">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function SmallMeter({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <p className="text-xl font-black text-white">{value}{suffix}</p>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="mt-1 h-1.5 rounded-full bg-white/10">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-brand-300 to-emerald-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProgressLine({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (value / total) * 100));
  return (
    <div>
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-400">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-gradient-to-r from-brand-300 to-violet-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FilePath({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-all font-mono text-xs text-slate-300">{value}</p>
    </div>
  );
}

function statusForLearner(status: string): HealthTone {
  if (status === "Healthy") return "ok";
  if (status === "At risk") return "danger";
  if (status === "Review queue") return "info";
  return "warn";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
