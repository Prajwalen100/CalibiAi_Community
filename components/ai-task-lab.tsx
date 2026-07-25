"use client";

import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Code2,
  FileCode2,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LAB_LANGUAGES,
  type LabLanguage,
  type RoadmapTask,
} from "@/lib/learning/task-types";

 type ReviewResult = {
  score: number;
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
  correctnessIssues: string[];
  motivation: string;
  aiEnriched: boolean;
  saved: boolean;
  pointsEarned: number;
  bestTaskPoints: number;
  calibiPointsAdded: number;
  calibiScore?: number;
};

type LabMode = "check" | "submit";
type LabTab = "problem" | "feedback";

const LANGUAGE_LABELS: Record<LabLanguage, string> = {
  python: "Python 3",
  javascript: "JavaScript",
  typescript: "TypeScript",
  sql: "SQL",
  json: "JSON",
  yaml: "YAML",
  bash: "Bash",
  markdown: "Written response",
};

function taskTypeLabel(taskType: RoadmapTask["taskType"]): string {
  if (taskType === "mini_project") return "Mini Project";
  if (taskType === "assignment") return "Assignment";
  return "Practical Task";
}

export function AiTaskLab({ task }: { task: RoadmapTask }) {
  const [language, setLanguage] = useState<LabLanguage>(task.suggestedLanguage);
  const [submission, setSubmission] = useState(task.starterCode);
  const [explanation, setExplanation] = useState("");
  const [activeTab, setActiveTab] = useState<LabTab>("problem");
  const [busyMode, setBusyMode] = useState<LabMode | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [consoleLines, setConsoleLines] = useState([
    "CalibiAI Lab ready.",
    "Write your solution, explain the approach, then run AI checks.",
  ]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const lineNumbersRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const draftKey = useMemo(
    () => `calibiai-lab:${task.role}:${task.level}:${task.dayNumber}:${task.taskType}`,
    [task]
  );
  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(1, submission.split("\n").length) }, (_, index) => index + 1).join("\n"),
    [submission]
  );

  useEffect(() => {
    let cancelled = false;
    // Load after hydration so server HTML stays deterministic and a saved
    // browser draft cannot cause a hydration mismatch.
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = window.localStorage.getItem(draftKey);
        if (saved) {
          const draft = JSON.parse(saved) as {
            language?: LabLanguage;
            submission?: string;
            explanation?: string;
          };
          if (draft.language && LAB_LANGUAGES.includes(draft.language)) setLanguage(draft.language);
          if (typeof draft.submission === "string") setSubmission(draft.submission);
          if (typeof draft.explanation === "string") setExplanation(draft.explanation);
        }
      } catch {
        // A corrupt local draft should never prevent the lab from opening.
      } finally {
        setDraftLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [draftKey]);

  useEffect(() => {
    if (!draftLoaded) return;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({ language, submission, explanation })
    );
  }, [draftKey, draftLoaded, explanation, language, submission]);

  function resetEditor() {
    setLanguage(task.suggestedLanguage);
    setSubmission(task.starterCode);
    setExplanation("");
    setResult(null);
    setError("");
    setActiveTab("problem");
    setConsoleLines(["Editor reset to the starter template."]);
    window.localStorage.removeItem(draftKey);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 250_000) {
      setError("Please upload a source file or notebook smaller than 250 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result ?? "");
        let extracted = raw;
        if (file.name.toLowerCase().endsWith(".ipynb")) {
          const notebook = JSON.parse(raw) as {
            cells?: Array<{ cell_type?: string; source?: string | string[] }>;
          };
          extracted = (notebook.cells ?? []).map((cell, index) => {
            const source = Array.isArray(cell.source)
              ? cell.source.join("")
              : String(cell.source ?? "");
            return cell.cell_type === "markdown"
              ? `# %% [markdown] Cell ${index + 1}\n${source.split("\n").map((line) => `# ${line}`).join("\n")}`
              : `# %% Cell ${index + 1}\n${source}`;
          }).join("\n\n");
          setLanguage("python");
        }
        if (extracted.length > 30_000) {
          throw new Error("The extracted submission exceeds 30,000 characters. Remove large outputs or unused cells and retry.");
        }
        setSubmission(extracted);
        setError("");
        setConsoleLines([`Loaded ${file.name} into the editor.`, file.name.endsWith(".ipynb") ? "Notebook code and markdown cells were extracted for AI evaluation." : "Source file ready for review."]);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The selected notebook is invalid.");
      }
    };
    reader.onerror = () => setError("The selected file could not be read.");
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = `${submission.slice(0, start)}  ${submission.slice(end)}`;
      setSubmission(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void review("check");
    }
  }

  async function review(mode: LabMode) {
    setError("");
    setResult(null);
    if (submission.trim().length < 20) {
      setError("Add a meaningful solution before requesting a review.");
      return;
    }

    setBusyMode(mode);
    setConsoleLines([
      mode === "check" ? "Running AI checks..." : "Submitting final solution...",
      "Loading the authored task rubric.",
      "Checking correctness, completeness, depth, and validation evidence.",
    ]);

    try {
      const response = await fetch("/api/ai/task-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          taskType: task.taskType,
          dayNumber: task.dayNumber,
          language,
          submission,
          explanation,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | ReviewResult
        | { error?: { message?: string } };
      if (!response.ok || !("score" in payload)) {
        throw new Error(
          "error" in payload
            ? payload.error?.message ?? "The assessment could not be reviewed."
            : "The assessment could not be reviewed."
        );
      }

      setResult(payload);
      setActiveTab("feedback");
      setConsoleLines([
        `Review complete: ${payload.score}/100 (${payload.passed ? "PASS" : "NEEDS WORK"}).`,
        payload.aiEnriched
          ? "DeepSeek rubric evaluation completed."
          : "Deterministic fallback rubric completed; no fabricated AI result was used.",
        mode === "submit"
          ? `Submission saved. ${payload.calibiPointsAdded > 0 ? `+${payload.calibiPointsAdded} CalibiAI points.` : "No additional points on this attempt."}`
          : "Practice check only — submit when ready to save the result and earn points.",
      ]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
      setConsoleLines(["Review failed.", message]);
    } finally {
      setBusyMode(null);
    }
  }

  const typeLabel = taskTypeLabel(task.taskType);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 text-white sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{task.roadmapTitle}</span>
                <span>•</span>
                <span>Day {task.dayNumber}</span>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-bold text-indigo-300">
                  AI Lab
                </span>
              </div>
              <h1 className="truncate text-sm font-bold sm:text-base">{task.dayTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300">
              Pass score: 60
            </span>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-300">
              Up to 5 points
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-3 p-3 lg:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.4fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("problem")}
              className={`flex-1 px-4 py-3 text-sm font-bold ${activeTab === "problem" ? "border-b-2 border-brand-500 text-brand-600" : "text-slate-500"}`}
            >
              <BookOpen className="mr-2 inline h-4 w-4" /> Problem
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("feedback")}
              className={`flex-1 px-4 py-3 text-sm font-bold ${activeTab === "feedback" ? "border-b-2 border-brand-500 text-brand-600" : "text-slate-500"}`}
            >
              <Sparkles className="mr-2 inline h-4 w-4" /> AI Feedback
            </button>
          </div>

          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5 lg:min-h-[720px]">
            {activeTab === "problem" ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                    {typeLabel}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {task.difficulty}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
                  Your task
                </h2>
                <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
                  {task.taskDescription}
                </p>

                <div className="mt-6">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Target className="h-4 w-4 text-brand-500" /> Learning objectives
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {task.objectives.map((objective) => (
                      <li key={objective} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>

                {task.expectedOutcome && (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Expected outcome
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-900 dark:text-emerald-100">
                      {task.expectedOutcome}
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="font-bold">Topics used by the AI rubric</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.topics.map((topic) => (
                      <span key={topic} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-100">
                  <p className="font-bold">How evaluation works</p>
                  <p className="mt-1 leading-6">
                    The evaluator compares your actual work with this authored task. It checks correctness, completeness, technical depth, and validation evidence—not length alone.
                  </p>
                </div>
              </div>
            ) : result ? (
              <ReviewPanel
                result={result}
                isMiniProject={task.taskType === "mini_project"}
                onBackToEditor={() => setActiveTab("problem")}
              />
            ) : (
              <div className="flex min-h-96 flex-col items-center justify-center text-center">
                <BrainCircuit className="h-12 w-12 text-slate-300" />
                <h2 className="mt-4 text-lg font-black">No review yet</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Write your solution and select Run AI Checks for practice, or Submit Assessment to save a scored attempt.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <FileCode2 className="h-4 w-4 text-brand-400" /> Solution
              <span className="text-xs font-normal text-slate-500">autosaved locally</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as LabLanguage)}
                className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-200 outline-none focus:border-brand-500"
                aria-label="Submission language"
              >
                {LAB_LANGUAGES.map((item) => (
                  <option key={item} value={item}>{LANGUAGE_LABELS[item]}</option>
                ))}
              </select>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Upload solution file">
                <Upload className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.py,.ipynb,.js,.ts,.tsx,.jsx,.sql,.json,.yaml,.yml,.md,.sh" onChange={handleUpload} className="hidden" />
              <button type="button" onClick={resetEditor} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Reset editor">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex h-[460px] bg-[#0b1120]">
            <pre ref={lineNumbersRef} aria-hidden className="w-12 shrink-0 overflow-hidden border-r border-slate-800 px-3 py-4 text-right font-mono text-sm leading-6 text-slate-600 select-none">
              {lineNumbers}
            </pre>
            <textarea
              value={submission}
              onChange={(event) => setSubmission(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              onScroll={(event) => {
                if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
              }}
              spellCheck={false}
              aria-label="Solution editor"
              className="h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-sm leading-6 text-sky-100 outline-none selection:bg-brand-500/30"
            />
          </div>

          <div className="border-t border-slate-800 bg-slate-900 p-4">
            <label htmlFor="lab-explanation" className="text-xs font-black uppercase tracking-wide text-slate-400">
              Explain your approach and validation
            </label>
            <textarea
              id="lab-explanation"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder="Explain your algorithm or design, important decisions, edge cases, and how you verified the result..."
              className="mt-2 h-24 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-brand-500"
            />
          </div>

          <div className="border-t border-slate-800 bg-black/40">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-bold text-slate-400">
              <Terminal className="h-3.5 w-3.5" /> AI CHECK OUTPUT
            </div>
            <div className="min-h-24 p-4 font-mono text-xs leading-6 text-slate-400">
              {consoleLines.map((line, index) => (
                <p key={`${line}-${index}`} className={line.includes("failed") ? "text-rose-400" : line.includes("PASS") || line.startsWith("Submission saved") ? "text-emerald-400" : ""}>
                  <span className="mr-2 text-slate-700">›</span>{line}
                </p>
              ))}
            </div>
          </div>

          {error && (
            <div role="alert" className="mx-4 mb-3 flex gap-2 rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500">
              Ctrl/⌘ + Enter runs a practice check
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void review("check")}
                disabled={busyMode !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50"
              >
                {busyMode === "check" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 text-emerald-400" />}
                Run AI Checks
              </button>
              <button
                type="button"
                onClick={() => void review("submit")}
                disabled={busyMode !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500 disabled:opacity-50"
              >
                {busyMode === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Assessment
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewPanel({
  result,
  isMiniProject,
  onBackToEditor,
}: {
  result: ReviewResult;
  isMiniProject: boolean;
  onBackToEditor: () => void;
}) {
  return (
    <div>
      <div className={`rounded-2xl border p-5 ${result.passed ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"}`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-black ${result.passed ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
            {result.score}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {result.passed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-amber-600" />}
              <h2 className="text-xl font-black">{result.passed ? "Assessment passed" : "Keep improving"}</h2>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Score {result.score}/100</p>
            <p className="mt-2 text-sm font-bold text-brand-700 dark:text-brand-300">{result.motivation}</p>
          </div>
        </div>
      </div>

      {result.saved && (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
          <div className="flex items-center gap-2 font-black text-violet-700 dark:text-violet-300">
            <Trophy className="h-5 w-5" /> CalibiAI points updated
          </div>
          <p className="mt-1 text-sm text-violet-900 dark:text-violet-100">
            {result.calibiPointsAdded > 0
              ? `+${result.calibiPointsAdded} points were added to your CalibiAI score.`
              : result.passed
                ? "This task was already awarded at the same or a higher level. Your best points are preserved."
                : "Improve the highlighted issues and pass the task to earn points."}
          </p>
          {typeof result.calibiScore === "number" && (
            <p className="mt-2 text-xs font-bold text-violet-600">Current CalibiAI score: {result.calibiScore}</p>
          )}
          {isMiniProject && result.passed && (
            <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              ✓ This passed mini project is now available in Your Projects and on your student profile.
            </p>
          )}
        </div>
      )}

      <div className="mt-5">
        <h3 className="font-black">Evaluator feedback</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{result.feedback}</p>
      </div>

      {result.correctnessIssues.length > 0 && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
          <h3 className="flex items-center gap-2 font-black text-rose-700 dark:text-rose-300">
            <CircleAlert className="h-4 w-4" /> What is wrong and needs fixing
          </h3>
          <ul className="mt-3 space-y-2">
            {result.correctnessIssues.map((issue) => (
              <li key={issue} className="flex gap-2 text-sm text-rose-900 dark:text-rose-100">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 p-4 dark:border-emerald-900">
          <h3 className="font-black text-emerald-700 dark:text-emerald-300">Strengths</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {result.strengths.map((strength) => <li key={strength}>• {strength}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-200 p-4 dark:border-amber-900">
          <h3 className="font-black text-amber-700 dark:text-amber-300">Next improvements</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {result.improvements.map((improvement) => <li key={improvement}>• {improvement}</li>)}
          </ul>
        </div>
      </div>

      {!result.saved && (
        <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-100">
          This was a practice check. Return to the editor, apply the feedback, and select <strong>Submit Assessment</strong> to save the attempt and earn points.
        </div>
      )}

      <button type="button" onClick={onBackToEditor} className="btn-secondary mt-5 w-full">
        <Code2 className="h-4 w-4" /> Back to problem
      </button>
    </div>
  );
}
