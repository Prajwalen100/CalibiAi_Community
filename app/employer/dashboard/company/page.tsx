import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompanyEditForm } from "./company-form";

export const dynamic = "force-dynamic";

export default async function EmployerCompanyPage() {
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

  if (!employer) redirect("/employer/onboarding");

  return (
    <div>
      <h1 className="text-2xl font-black text-primary">Company profile</h1>
      <p className="mt-2 text-secondary">
        Keep your company details accurate — they appear on every job you post.
      </p>
      <CompanyEditForm employer={employer} />
    </div>
  );
}
