import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EmployerJobForm } from "./job-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string }>;

export default async function EmployerPostJobPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!employer?.onboarding_complete) redirect("/employer/onboarding");

  const isGig = category === "freelance";

  return (
    <div>
      <Link
        href="/employer/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-black text-primary">
        {isGig ? "Post a freelance gig" : "Post a job or opportunity"}
      </h1>
      <p className="mt-2 text-secondary">
        Publishing as <strong>{employer.company_name}</strong>. Students will see this on Jobs &amp; Opportunity.
      </p>
      <EmployerJobForm
        defaultEmail={employer.email || user.email || ""}
        defaultLocation={employer.location || ""}
        defaultWebsite={employer.website || ""}
        defaultCategory={isGig ? "freelance" : "job"}
      />
    </div>
  );
}
