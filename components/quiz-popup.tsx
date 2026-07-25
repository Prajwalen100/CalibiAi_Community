"use client";

import { useState, useCallback } from "react";
import { X, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";

type QuizOption = { text: string; label: string };
type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
  correctIndex: number;
  explanation: string;
};

export function QuizPopup({
  isOpen,
  onClose,
  dayTitle,
  dayNumber,
  questions,
  onScoreCalculated,
}: {
  isOpen: boolean;
  onClose: () => void;
  dayTitle: string;
  dayNumber: number;
  questions: QuizQuestion[];
  onScoreCalculated?: (score: number, total: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  // Shuffle logic using a simple seeded shuffle for consistency per session
  const shuffledQuestions = useCallback(() => {
    if (!questions || questions.length === 0) return [];
    const seed = `${dayNumber}-${dayTitle}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    const rng = () => {
      hash = (hash * 1664525 + 1013904223) % 4294967296;
      return hash / 4294967296;
    };
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [questions, dayNumber, dayTitle]);

  const currentQuestions = shuffledQuestions();
  const currentQ = currentQuestions[currentIndex];

  function handleAnswer(index: number) {
    if (revealed[currentQ.id]) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: index }));
    setRevealed((prev) => ({ ...prev, [currentQ.id]: true }));
  }

  function finishQuiz() {
    const correctCount = currentQuestions.filter(
      (q) => answers[q.id] === q.correctIndex
    ).length;
    const finalScore = Math.round((correctCount / currentQuestions.length) * 100);
    setScore(finalScore);
    setCompleted(true);
    if (onScoreCalculated) onScoreCalculated(finalScore, currentQuestions.length);
  }

  function resetQuiz() {
    setCurrentIndex(0);
    setAnswers({});
    setRevealed({});
    setScore(null);
    setCompleted(false);
  }

  if (!isOpen) return null;

  if (completed && score !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Quiz Complete!</h2>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black ${
              score >= 80 ? "bg-emerald-100 text-emerald-600" : score >= 50 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
            }`}>
              {score >= 80 ? <Trophy className="h-10 w-10" /> : `${score}%`}
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500">Day {dayNumber}: {dayTitle}</p>
              <p className="mt-1 text-lg font-bold">Score: {score}%</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{score >= 80 ? "Excellent!" : score >= 50 ? "Good progress — keep practicing!" : "Review the material and try again."}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={resetQuiz} className="btn-secondary w-full">Retry Quiz</button>
            <button onClick={onClose} className="btn-primary w-full">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-4 text-white">
          <div>
            <p className="text-xs font-bold opacity-80">Day {dayNumber} • Quiz</p>
            <h2 className="text-lg font-black">{dayTitle}</h2>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/20 p-1 hover:bg-white/30 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm font-semibold text-brand-600">
            <span>Question {currentIndex + 1} of {currentQuestions.length}</span>
            <span>Shuffled order</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }} />
          </div>

          {/* Question */}
          <h3 className="mt-6 text-xl font-black text-slate-900 dark:text-white">{currentQ.question}</h3>

          {/* Options */}
          <div className="mt-5 grid gap-3">
            {currentQ.options.map((opt, i) => {
              const isCorrect = i === currentQ.correctIndex;
              const isSelected = answers[currentQ.id] === i;
              const showReveal = revealed[currentQ.id];

              let btnClass = "border-slate-200 hover:border-brand-500 dark:border-slate-700";
              if (showReveal) {
                if (isCorrect) btnClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
                else if (isSelected) btnClass = "border-rose-500 bg-rose-50 dark:bg-rose-950/30";
                else btnClass = "border-slate-200 dark:border-slate-700 opacity-60";
              } else if (isSelected) {
                btnClass = "border-brand-500 bg-brand-50 dark:bg-brand-950/20";
              }

              return (
                <button
                  key={i}
                  disabled={showReveal}
                  onClick={() => handleAnswer(i)}
                  className={`rounded-2xl border-2 p-4 text-left font-medium transition ${btnClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">
                      {opt.label}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reveal */}
          {revealed[currentQ.id] && (
            <div className={`mt-5 rounded-2xl p-4 ${answers[currentQ.id] === currentQ.correctIndex ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" : "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"}`}>
              <div className="flex items-center gap-2 font-bold">
                {answers[currentQ.id] === currentQ.correctIndex ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-amber-600" />}
                {answers[currentQ.id] === currentQ.correctIndex ? "Correct!" : "Not quite — see explanation below."}
              </div>
              <p className="mt-2 text-sm">{currentQ.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="btn-secondary text-sm"
            >
              Previous
            </button>

            {currentIndex < currentQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                disabled={!revealed[currentQ.id]}
                className="btn-primary text-sm"
              >
                Next
              </button>
            ) : (
              <button
                onClick={finishQuiz}
                disabled={!revealed[currentQ.id]}
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
