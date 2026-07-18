import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JobPostForm } from "./job-post-form";

export const dynamic = "force-dynamic";

export default async function CreateJobPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div>
      <h1 className="text-2xl font-black">Post a Job</h1>
      <p className="mt-2 text-slate-600">Share a complete opportunity with the CalibiAI community.</p>
      <JobPostForm />
    </div>
  );
}
