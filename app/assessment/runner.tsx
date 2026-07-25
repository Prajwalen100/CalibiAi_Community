"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, Trophy, TrendingUp, Target, Zap, ArrowRight } from "lucide-react";

type Question = {
  id: string;
  skill: string;
  difficulty: string;
  question: string;
  options: string[];
};

type Reveal = {
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
};

type Result = {
  overall: number;
  level: string;
  skillScores: { skill: string; score: number; band: string }[];
};

type ViewState = "quiz" | "submitting" | "results" | "error";

export function AssessmentRunner() {
  const [attempt, setAttempt] = useState<string>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [reveals, setReveals] = useState<Record<string, Reveal>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("quiz");
  const [result, setResult] = useState<Result | null>(null);

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    
    fetch("/api/assessment/start", { method: "POST" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || result.error) {
          throw new Error(result.error?.message ?? "Unable to start the assessment.");
        }
        return result;
      })
      .then((result) => {
        setAttempt(result.data.attemptId);
        setQuestions(result.data.questions);
        setAnswers(result.data.answers);
        const firstUnanswered = result.data.questions.findIndex(
          (question: Question) => result.data.answers[question.id] === undefined
        );
        setIndex(firstUnanswered < 0 ? result.data.questions.length - 1 : firstUnanswered);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to start the assessment."))
      .finally(() => setLoading(false));
  }, []);

  const question = questions[index];

  async function answer(selectedIndex: number) {
    if (!attempt || !question || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/assessment/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: attempt,
          question_id: question.id,
          selected_index: selectedIndex,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? "Unable to save your answer.");
      }
      setAnswers((current) => ({ ...current, [question.id]: selectedIndex }));
      setReveals((current) => ({ ...current, [question.id]: result.data }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reveal the answer.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!attempt || busy) return;
    setBusy(true);
    setViewState("submitting");
    setError("");
    try {
      const response = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt_id: attempt }),
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message ?? "Unable to finish the assessment.");
      }
      setResult(result.data);
      setViewState("results");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to finish the assessment.");
      setViewState("error");
      setBusy(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-600" />
          <p className="mt-4 font-semibold text-brand-700">Loading your assessment...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && viewState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <p className="font-bold">Error</p>
          </div>
          <p className="mt-2 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setViewState("quiz");
              started.current = false;
              window.location.reload();
            }}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // Submitting state
  if (viewState === "submitting") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
          <h1 className="mt-6 text-2xl font-black">Calculating your results...</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Analyzing your skill levels and preparing your personalized roadmap
          </p>
        </div>
      </main>
    );
  }

  // Results state
  if (viewState === "results" && result) {
    const bandColor = result.overall >= 75 
      ? "text-emerald-600" 
      : result.overall >= 50 
        ? "text-amber-600" 
        : "text-rose-600";
    const bandBg = result.overall >= 75 
      ? "bg-emerald-50 border-emerald-200" 
      : result.overall >= 50 
        ? "bg-amber-50 border-amber-200" 
        : "bg-rose-50 border-rose-200";

    return (
      <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950 sm:p-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center">
            <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${bandBg}`}>
              <Trophy className={`h-8 w-8 ${bandColor}`} />
            </div>
            <h1 className="mt-4 text-3xl font-black">Assessment Complete!</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Based on your {questions.length} answers, here&apos;s your skill profile
            </p>
          </div>

          {/* Overall Score */}
          <div className={`mt-6 rounded-3xl border p-6 ${bandBg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Overall Score</p>
                <p className={`mt-1 text-5xl font-black ${bandColor}`}>{result.overall}%</p>
                <p className="mt-1 text-sm capitalize text-slate-600 dark:text-slate-400">
                  {result.overall >= 75 ? "Strong Performance" : result.overall >= 50 ? "Developing Skills" : "Foundation Building"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-500">Assigned Level</p>
                <p className="mt-1 text-3xl font-black capitalize text-brand-600">{result.level}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Personalized roadmap</p>
              </div>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold">Skill Breakdown</h2>
            </div>
            <div className="mt-4 space-y-3">
              {result.skillScores.map((skill) => {
                const skillColor = skill.band === "strong" 
                  ? "bg-emerald-100 text-emerald-700" 
                  : skill.band === "developing" 
                    ? "bg-amber-100 text-amber-700" 
                    : "bg-rose-100 text-rose-700";
                
                return (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{skill.skill}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${skillColor}`}>
                          {skill.band}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div 
                          className={`h-full rounded-full ${
                            skill.band === "strong" ? "bg-emerald-500" 
                            : skill.band === "developing" ? "bg-amber-500" 
                            : "bg-rose-500"
                          }`}
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm font-bold text-slate-500">{skill.score}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-6 rounded-3xl bg-brand-50 p-6 dark:bg-brand-950/30">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold">What&apos;s Next</h2>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Your personalized roadmap is being prepared based on your assessment results. 
              We&apos;ve identified your strengths to build on and areas to focus on.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-brand-700">
                <Target className="h-4 w-4" />
                <span>{result.skillScores.filter(s => s.band === "weak").length} skills to strengthen</span>
              </div>
              <a href="/roadmap/assign" className="btn-primary inline-flex items-center gap-2">
                View My Roadmap <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Skip to Dashboard */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Your score has been saved and will be reflected in your CalibiAI Score.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Quiz state
  if (!question) return null;
  const reveal = reveals[question.id];

  return (
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-10">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="flex justify-between text-sm font-bold text-secondary">
          <span>Question {index + 1} of {questions.length}</span>
          <span>{question.skill} · {question.difficulty}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h1 className="mt-8 text-xl font-black text-primary">{question.question}</h1>
        <div className="mt-6 grid gap-3">
          {question.options.map((option, optionIndex) => {
            const selected = answers[question.id] === optionIndex;
            const correct = reveal?.correct_answer === optionIndex;
            const className = reveal
              ? correct
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                : selected
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                  : "border-slate-200 dark:border-slate-700"
              : "border-slate-200 hover:border-brand-500 dark:border-slate-700";

            return (
              <button
                type="button"
                disabled={Boolean(reveal) || busy}
                onClick={() => void answer(optionIndex)}
                key={option}
                className={`rounded-2xl border p-4 text-left font-medium transition ${className}`}
              >
                {String.fromCharCode(65 + optionIndex)}. {option}
              </button>
            );
          })}
        </div>

        {reveal && (
          <div className={`mt-5 rounded-2xl p-4 ${
            reveal.is_correct 
              ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100" 
              : "bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
          }`}>
            <div className="flex items-center gap-2">
              {reveal.is_correct ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-600" />
              )}
              <b>{reveal.is_correct ? "Correct!" : "The correct answer is highlighted."}</b>
            </div>
            <p className="mt-2 text-sm">{reveal.explanation}</p>
          </div>
        )}

        {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}

        <div className="mt-7 flex justify-end">
          {reveal && (index === questions.length - 1 ? (
            <button type="button" onClick={() => void finish()} className="btn-primary" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Finish assessment
            </button>
          ) : (
            <button type="button" onClick={() => setIndex(index + 1)} className="btn-primary">
              Next
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
