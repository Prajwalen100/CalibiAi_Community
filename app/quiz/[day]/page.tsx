import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { QuizPopup } from "@/components/quiz-popup";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: dayParam } = await params;
  const dayNumber = parseInt(dayParam || "1", 10);

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  // Load the roadmap for questions
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("generated_plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const plan = roadmap?.generated_plan as { days?: Array<{ day?: number; title?: string; quiz?: Array<{ question: string; options: string[]; answer: string | number; explanation?: string }> }> } | null;
  const currentDay = plan?.days?.find((d: { day?: number; title?: string; quiz?: Array<{ question: string; options: string[]; answer: string | number; explanation?: string }> }) => d.day === dayNumber);
  const quizQuestions = currentDay?.quiz || [];

  const formattedQuestions = quizQuestions.map((q: { question: string; options: string[]; answer: string | number; explanation?: string }, i: number) => ({
    id: `quiz-day-${dayNumber}-q${i}`,
    question: q.question || "Sample question",
    options: q.options?.map((opt: string, idx: number) => ({ text: opt, label: String.fromCharCode(65 + idx) })) || [
      { text: "Option A", label: "A" },
      { text: "Option B", label: "B" },
      { text: "Option C", label: "C" },
      { text: "Option D", label: "D" },
    ],
    // Content may store the correct answer as either an option index or option text.
    correctIndex: typeof q.answer === "number"
      ? q.answer
      : Math.max(0, q.options?.findIndex((option: string) => option === q.answer) ?? 0),
    explanation: q.explanation || "Review the material for this day.",
  }));

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={`/roadmap/day/${dayNumber}`} className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Day {dayNumber}
      </Link>

      <QuizPopup
        isOpen={true}
        onClose={() => redirect(`/roadmap/day/${dayNumber}`)}
        dayTitle={currentDay?.title || `Day ${dayNumber}`}
        dayNumber={dayNumber}
        questions={formattedQuestions}
        onScoreCalculated={(score, total) => {
          // Call server action or API to save quiz score
          fetch("/api/score/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quizAverage: score }),
          }).catch(() => {});
        }}
      />
    </section>
  );
}
