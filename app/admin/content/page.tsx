import { BookOpenCheck, ClipboardCheck, GitBranch, GraduationCap, ListChecks, Route } from "lucide-react";
import { requireAdmin } from "../_lib/guard";
import { AdminShell } from "../_components/admin-shell";
import { FilePath, MiniStat, Panel, ProgressLine, StatCard, StatusPill, formatNumber } from "../_components/ui";
import {
  getLearningEngineAdminData,
  type AssessmentSummary,
  type RoadmapSummary,
  type RoleDefinition,
} from "../_lib/learning-engine-admin-data";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const session = await requireAdmin("/admin/content");
  const data = await getLearningEngineAdminData();

  return (
    <AdminShell
      active="content"
      eyebrow="Content operations"
      title="Knowledge base audit"
      description="Read-only verification of the committed assessment banks and 45-day roadmap JSON files that power learner placement and daily missions."
      adminEmail={session.email}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardCheck} label="Assessment banks" value={`${data.totals.assessmentBanks}/4`} detail="One 100-question bank per role" accent="brand" />
        <StatCard icon={ListChecks} label="Questions served" value="20" detail="2 per skill at runtime" accent="violet" />
        <StatCard icon={Route} label="Roadmap files" value={`${data.totals.roadmapFiles}/8`} detail="Beginner + intermediate per role" accent="emerald" />
        <StatCard icon={BookOpenCheck} label="Learning assets" value={formatNumber(data.totals.resourceLinks)} detail="Videos, docs, repos and papers" accent="amber" />
      </div>

      <Panel
        title="Role to file resolver"
        description="The deterministic mapping used when a learner is assigned a roadmap."
        icon={GitBranch}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {data.roles.map((role) => (
            <div key={role.key} className="admin-glass-soft p-4">
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${role.accent} text-white`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black admin-title">{role.label}</h3>
                  <p className="mt-1 text-sm leading-6 admin-muted">{role.description}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <FilePath label="Assessment" value={`content/assessment/${role.assessmentFile}`} />
                <FilePath label="Beginner" value={`content/roadmap/${role.roadmapFiles.beginner}`} />
                <FilePath label="Intermediate" value={`content/roadmap/${role.roadmapFiles.intermediate}`} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Assessment bank audit"
        description="Each bank should hold 100 questions across 10 skills with valid 0-based answer indexes."
        icon={ClipboardCheck}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {data.assessments.map((assessment) => (
            <AssessmentCard key={assessment.fileName} assessment={assessment} />
          ))}
        </div>
      </Panel>

      <Panel
        title="Roadmap audit"
        description="Every role ships a beginner and intermediate 45-day plan with embedded quizzes and projects."
        icon={Route}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {data.roles.map((role) => (
            <RoadmapCard
              key={role.key}
              role={role}
              roadmaps={data.roadmaps.filter((roadmap) => roadmap.role.key === role.key)}
            />
          ))}
        </div>
      </Panel>
    </AdminShell>
  );
}

function AssessmentCard({ assessment }: { assessment: AssessmentSummary }) {
  return (
    <div className="admin-glass-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black admin-title">{assessment.role.label}</h3>
            <StatusPill status={assessment.status} label={assessment.status === "ok" ? "valid" : "check"} />
          </div>
          <p className="admin-mono mt-1 break-all text-[11px] admin-faint">{assessment.fileName}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStat value={assessment.totalQuestions} label="questions" />
          <MiniStat value={assessment.skillCount} label="skills" />
          <MiniStat value={assessment.generatedAssessmentSize} label="served" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="admin-glass-soft p-3">
          <p className="admin-eyebrow">Difficulty split</p>
          <div className="mt-3 space-y-2">
            {Object.entries(assessment.difficultyCounts).map(([difficulty, count]) => (
              <ProgressLine key={difficulty} label={difficulty} value={count} total={assessment.totalQuestions || 1} />
            ))}
          </div>
        </div>
        <div className="admin-glass-soft p-3">
          <p className="admin-eyebrow">Contract</p>
          <dl className="mt-3 space-y-2 text-xs admin-muted">
            <div className="flex justify-between gap-3">
              <dt>Answer reveal</dt>
              <dd className="font-bold admin-title">{assessment.answerReveal}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Passing score</dt>
              <dd className="font-bold admin-title">{assessment.passingScore}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Valid answers</dt>
              <dd className="font-bold admin-title">
                {assessment.validAnswerIndexes}/{assessment.totalQuestions}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {assessment.skills.map((skill) => (
          <span key={skill} className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold admin-muted">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function RoadmapCard({ role, roadmaps }: { role: RoleDefinition; roadmaps: RoadmapSummary[] }) {
  return (
    <div className="admin-glass-soft p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${role.accent} text-white`}>
          <Route className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black admin-title">{role.label}</h3>
          <p className="mt-1 text-sm leading-6 admin-muted">{role.description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {roadmaps.map((roadmap) => (
          <div key={roadmap.fileName} className="admin-glass-soft p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold capitalize admin-title">{roadmap.level}</p>
              <StatusPill status={roadmap.status} label={`${roadmap.totalDays} days`} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniStat value={roadmap.resourceTotals.quizQuestions} label="quiz" />
              <MiniStat value={roadmap.resourceTotals.videos} label="videos" />
              <MiniStat value={roadmap.resourceTotals.projects} label="projects" />
            </div>
            <p className="mt-3 line-clamp-2 text-xs leading-5 admin-muted">Day 1: {roadmap.firstDayTitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
