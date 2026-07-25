"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Trophy, X, XCircle } from "lucide-react";
import {
  shuffleQuizQuestions,
  type QuizQuestion,
} from "@/lib/learning/quiz-shuffle";

export function QuizPopup({
  isOpen,
  onClose,
  dayTitle,
  dayNumber,
  questions,
  attemptSeed,
  onScoreCalculated,
}: {
  isOpen: boolean;
  onClose: () => void;
  dayTitle: string;
  dayNumber: number;
  questions: QuizQuestion[];
  attemptSeed: string;
  onScoreCalculated?: (score: number, total: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // One seed per attempt keeps the order stable across renders. Both questions
  // and options are shuffled, and shuffleQuizQuestions remaps correctIndex.
  const currentQuestions = useMemo(
    () => shuffleQuizQuestions(questions, `${attemptSeed}:${attempt}`),
    [questions, attemptSeed, attempt]
  );
  const currentQ = currentQuestions[currentIndex];

  function handleAnswer(index: number) {
    if (!currentQ || revealed[currentQ.id]) return;
    setAnswers((previous) => ({ ...previous, [currentQ.id]: index }));
    setRevealed((previous) => ({ ...previous, [currentQ.id]: true }));
  }

  function finishQuiz() {
    if (currentQuestions.length === 0) return;

    const correctCount = currentQuestions.filter(
      (question) => answers[question.id] === question.correctIndex
    ).length;
    const finalScore = Math.round((correctCount / currentQuestions.length) * 100);
    setScore(finalScore);
    setCompleted(true);
    onScoreCalculated?.(finalScore, currentQuestions.length);
  }

  function resetQuiz() {
    setCurrentIndex(0);
    setAnswers({});
    setRevealed({});
    setScore(null);
    setCompleted(false);
    setAttempt((value) => value + 1);
  }

  if (!isOpen) return null;

  if (!currentQ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div
          className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900"
          role="alert"
        >
          <h2 className="text-xl font-black">Quiz unavailable</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This day does not have a valid quiz yet. Return to the roadmap and try again.
          </p>
          <button type="button" onClick={onClose} className="btn-primary mt-5">
            Back to Day {dayNumber}
          </button>
        </div>
      </div>
    );
  }

  if (completed && score !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Quiz Complete!</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quiz"
              className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center gap-4">
            <div
              className={`inline-flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black ${
                score >= 80
                  ? "bg-emerald-100 text-emerald-600"
                  : score >= 50
                    ? "bg-amber-100 text-amber-600"
                    : "bg-rose-100 text-rose-600"
              }`}
            >
              {score >= 80 ? <Trophy className="h-10 w-10" /> : `${score}%`}
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Day {dayNumber}: {dayTitle}
              </p>
              <p className="mt-1 text-lg font-bold">Score: {score}%</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {score >= 80
                  ? "Excellent!"
                  : score >= 50
                    ? "Good progress — keep practicing!"
                    : "Review the material and try again."}
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={resetQuiz} className="btn-secondary w-full">
              Retry Quiz
            </button>
            <button type="button" onClick={onClose} className="btn-primary w-full">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedAnswer = answers[currentQ.id];
  const isRevealed = revealed[currentQ.id] === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-4 text-white">
          <div>
            <p className="text-xs font-bold opacity-80">Day {dayNumber} • Quiz</p>
            <h2 className="text-lg font-black">{dayTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quiz"
            className="rounded-full bg-white/20 p-1 transition hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between text-sm font-semibold text-brand-600">
            <span>
              Question {currentIndex + 1} of {currentQuestions.length}
            </span>
            <span>Questions &amp; options shuffled</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}
            />
          </div>

          <h3 className="mt-6 text-xl font-black text-slate-900 dark:text-white">
            {currentQ.question}
          </h3>

          <div className="mt-5 grid gap-3">
            {currentQ.options.map((option, index) => {
              const isCorrect = index === currentQ.correctIndex;
              const isSelected = selectedAnswer === index;

              let buttonClass =
                "border-slate-200 hover:border-brand-500 dark:border-slate-700";
              if (isRevealed) {
                if (isCorrect) {
                  buttonClass =
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
                } else if (isSelected) {
                  buttonClass = "border-rose-500 bg-rose-50 dark:bg-rose-950/30";
                } else {
                  buttonClass = "border-slate-200 opacity-60 dark:border-slate-700";
                }
              }

              return (
                <button
                  type="button"
                  key={`${currentQ.id}-${index}`}
                  disabled={isRevealed}
                  onClick={() => handleAnswer(index)}
                  className={`rounded-2xl border-2 p-4 text-left font-medium transition ${buttonClass}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {isRevealed && (
            <div
              className={`mt-5 rounded-2xl p-4 ${
                selectedAnswer === currentQ.correctIndex
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                  : "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {selectedAnswer === currentQ.correctIndex ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-amber-600" />
                )}
                {selectedAnswer === currentQ.correctIndex
                  ? "Correct!"
                  : "Not quite — see the explanation below."}
              </div>
              <p className="mt-2 text-sm">{currentQ.explanation}</p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className="btn-secondary text-sm"
            >
              Previous
            </button>

            {currentIndex < currentQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((index) =>
                    Math.min(currentQuestions.length - 1, index + 1)
                  )
                }
                disabled={!isRevealed}
                className="btn-primary text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={finishQuiz}
                disabled={!isRevealed}
                className="btn-primary text-sm"
              >
                Finish Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
