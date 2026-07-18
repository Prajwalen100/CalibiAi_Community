import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SubmitProjectForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ module_id?: string; module_title?: string; build_task?: string }>;
}) {
  const { module_id, module_title, build_task } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-6">
        <p className="font-semibold text-brand-700">Submit a Project</p>
        <h1 className="mt-2 text-3xl font-black">Get your project verified & scored by AI</h1>
        <p className="mt-3 text-slate-600">
          Fill in the details below. Amazon Bedrock will review your submission and assign a verified score
          that contributes to your CalibiAI profile.
        </p>
      </div>

      {module_title && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-700">Building for module: {module_title}</p>
          {build_task && <p className="mt-1 text-sm text-brand-600">{build_task}</p>}
        </div>
      )}

      <SubmitProjectForm
        moduleId={module_id}
        moduleTitle={module_title}
        buildTask={build_task}
      />
    </section>
  );
}
