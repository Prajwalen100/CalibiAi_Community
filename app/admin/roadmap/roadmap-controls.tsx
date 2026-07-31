"use client";

import { useActionState } from "react";
import { CheckCircle2, Sliders, TriangleAlert, UserCog } from "lucide-react";

import { Panel, Pill } from "../_components/ui";
import {
  clearLearnerOverrideAction,
  overrideLearnerStageAction,
  updateAutoPromotionAction,
  updatePlacementThresholdAction,
  type AdminActionState,
} from "./actions";

export type RoadmapFileRow = {
  role: string;
  roleTitle: string;
  stage: string;
  fileName: string;
  totalDays: number;
  totalWeeks: number;
  title: string;
};

export type LearnerRow = {
  userId: string;
  name: string;
  email: string;
  stage: string | null;
  entryStage: string | null;
  overallDay: number | null;
  overallJourneyDays: number | null;
  override: string | null;
};

function Feedback({ state }: { state: AdminActionState }) {
  if (!state) return null;
  return (
    <p
      role="status"
      className={`mt-3 flex items-center gap-2 text-sm font-semibold ${
        state.ok ? "text-emerald-700" : "text-rose-700"
      }`}
    >
      {state.ok ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
      {state.message}
    </p>
  );
}

/**
 * Admin roadmap controls.
 *
 * Deliberately offers no "create roadmap" affordance: the eight JSON files in
 * `content/roadmap/` are the single source of truth, and admins only map
 * learners onto them.
 */
export function RoadmapControls({
  threshold,
  thresholdSource,
  autoPromotionEnabled,
  files,
  learners,
}: {
  threshold: number;
  thresholdSource: string;
  autoPromotionEnabled: boolean;
  files: RoadmapFileRow[];
  learners: LearnerRow[];
}) {
  const [thresholdState, thresholdAction, thresholdPending] = useActionState(
    updatePlacementThresholdAction,
    null,
  );
  const [promotionState, promotionAction, promotionPending] = useActionState(
    updateAutoPromotionAction,
    null,
  );
  const [overrideState, overrideAction, overridePending] = useActionState(
    overrideLearnerStageAction,
    null,
  );
  const [clearState, clearAction, clearPending] = useActionState(clearLearnerOverrideAction, null);

  return (
    <div className="grid gap-5">
      <Panel
        title="Placement threshold"
        description="Assessment score at or above which a learner is placed directly into the Intermediate roadmap. Below it they start on Beginner and are promoted automatically at 100%."
        icon={Sliders}
        action={<Pill tone="neutral">Source: {thresholdSource}</Pill>}
      >
        <form action={thresholdAction} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.12em] admin-faint">
              Threshold (0-100)
            </span>
            <input
              type="number"
              name="threshold"
              min={0}
              max={100}
              defaultValue={threshold}
              required
              className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
            />
          </label>
          <button
            type="submit"
            disabled={thresholdPending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {thresholdPending ? "Saving…" : "Save threshold"}
          </button>
        </form>
        <Feedback state={thresholdState} />
      </Panel>

      <Panel
        title="Automatic stage promotion"
        description="When enabled, finishing 100% of the Beginner roadmap immediately activates the Intermediate roadmap for that learner. Their progress, score and journey continue without a new account."
        icon={CheckCircle2}
        action={
          <Pill tone={autoPromotionEnabled ? "ok" : "warn"}>
            {autoPromotionEnabled ? "Enabled" : "Disabled"}
          </Pill>
        }
      >
        <form action={promotionAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="enabled" value={autoPromotionEnabled ? "false" : "true"} />
          <button
            type="submit"
            disabled={promotionPending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {promotionPending ? "Saving…" : autoPromotionEnabled ? "Disable auto-promotion" : "Enable auto-promotion"}
          </button>
        </form>
        <Feedback state={promotionState} />
      </Panel>

      <Panel
        title="Roadmap library"
        description="The roadmap JSON files already present in content/roadmap/. These are read-only: roadmaps are authored in the repository, never created from the admin panel."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider admin-faint">
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Days</th>
                <th className="px-3 py-2">Weeks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file) => (
                <tr key={`${file.role}-${file.stage}`}>
                  <td className="px-3 py-2 font-semibold admin-title">{file.roleTitle}</td>
                  <td className="px-3 py-2 capitalize">{file.stage}</td>
                  <td className="px-3 py-2 font-mono text-xs admin-muted">{file.fileName}</td>
                  <td className="px-3 py-2">{file.totalDays}</td>
                  <td className="px-3 py-2">{file.totalWeeks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Assign or override a learner's roadmap"
        description="Moves a learner onto an existing roadmap stage. Their journey length is preserved, and their day progress for the new stage starts fresh."
        icon={UserCog}
      >
        <form action={overrideAction} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.12em] admin-faint">Learner</span>
            <select
              name="userId"
              required
              defaultValue=""
              className="min-w-[280px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
            >
              <option value="" disabled>
                Select a learner…
              </option>
              {learners.map((learner) => (
                <option key={learner.userId} value={learner.userId}>
                  {learner.name} ({learner.email}) — {learner.stage ?? "unassigned"}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.12em] admin-faint">Stage</span>
            <select
              name="stage"
              required
              defaultValue="beginner"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={overridePending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {overridePending ? "Applying…" : "Apply override"}
          </button>
        </form>
        <Feedback state={overrideState} />

        {learners.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider admin-faint">
                  <th className="px-3 py-2">Learner</th>
                  <th className="px-3 py-2">Entry</th>
                  <th className="px-3 py-2">Current stage</th>
                  <th className="px-3 py-2">Journey</th>
                  <th className="px-3 py-2">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {learners.map((learner) => (
                  <tr key={learner.userId}>
                    <td className="px-3 py-2">
                      <span className="block font-semibold admin-title">{learner.name}</span>
                      <span className="block text-xs admin-muted">{learner.email}</span>
                    </td>
                    <td className="px-3 py-2 capitalize">{learner.entryStage ?? "—"}</td>
                    <td className="px-3 py-2 capitalize">{learner.stage ?? "—"}</td>
                    <td className="px-3 py-2">
                      {learner.overallJourneyDays
                        ? `Day ${learner.overallDay ?? 1} / ${learner.overallJourneyDays}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {learner.override ? (
                        <form action={clearAction} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={learner.userId} />
                          <span className="capitalize">{learner.override}</span>
                          <button
                            type="submit"
                            disabled={clearPending}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Clear
                          </button>
                        </form>
                      ) : (
                        <span className="admin-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Feedback state={clearState} />
          </div>
        )}
      </Panel>
    </div>
  );
}
