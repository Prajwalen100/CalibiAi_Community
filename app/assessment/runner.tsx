"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

export function AssessmentRunner() {
  const [attempt, setAttempt] = useState<string>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [reveals, setReveals] = useState<Record<string, Reveal>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
      // Assignment is a retry-safe separate step. Student areas remain locked
      // until it succeeds and marks onboarding as completed.
      window.location.assign("/roadmap/assign");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to finish the assessment.");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl p-10">
        <div className="skeleton h-80 rounded-3xl" />
      </main>
    );
  }

  if (error && !question) {
    return (
      <main className="mx-auto max-w-xl p-10">
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-bold">The assessment could not start</p>
          <p className="mt-1 text-sm">{error}</p>
          <a href="/onboarding" className="btn-secondary mt-4 inline-flex">Return to onboarding</a>
        </div>
      </main>
    );
  }

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
            className="h-full rounded-full bg-brand-500"
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
          <div className={`mt-5 rounded-2xl p-4 ${reveal.is_correct ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100" : "bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"}`}>
            <b>{reveal.is_correct ? "Correct!" : "The correct answer is highlighted."}</b>
            <p className="mt-1 text-sm">{reveal.explanation}</p>
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
