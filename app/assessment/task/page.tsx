import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { TaskAssessmentPopup } from "@/components/task-assessment-popup";
import { CodeEditor } from "@/components/code-editor";

export const dynamic = "force-dynamic";

export default async function TaskAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; day?: string; title?: string; open?: string }>;
}) {
  const params = await searchParams;
  const { type = "practical_task", day = "", title = "" } = params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={`/roadmap/day/${day || 1}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Back to Day {day || 1}
      </Link>

      <div className="mt-6 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-indigo-50 p-6 dark:border-brand-800 dark:from-brand-950/30 dark:to-indigo-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-700">AI Assessment</p>
            <h1 className="text-2xl font-black">Submit Your {type.replace("_", " ")}</h1>
          </div>
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          DeepSeek will evaluate your work for this task, calculate a dynamic score based on correctness and depth, and add points to your CalibiAI profile.
        </p>
      </div>

      <CodeEditor taskType={type} dayNumber={parseInt(day || "1", 10)} taskTitle={title} />

      <TaskAssessmentPopup
        isOpen={true}
        onClose={() => redirect(`/roadmap/day/${day || 1}`)}
        taskType={type as "practical_task" | "mini_project" | "assignment"}
        taskDescription={title}
        dayNumber={parseInt(day || "1", 10)}
        onScoreCalculated={(score, feedback) => {
          // In a real implementation, this would call an API to save the score to the user's profile
          console.log("AI Score:", score, "Feedback:", feedback);
        }}
      />
    </section>
  );
}
