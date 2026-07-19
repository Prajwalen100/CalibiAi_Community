import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SignInPageClient } from "./sign-in-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: "sign-up" | "sign-in" }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { mode: rawMode } = await searchParams;
  const mode: "sign-up" | "sign-in" = rawMode === "sign-in" ? "sign-in" : "sign-up";

  // Redirect already-authenticated users to the community.
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) redirect("/community");
  } catch {
    // Supabase not configured or offline — render the page anyway.
  }

  return <SignInPageClient mode={mode} />;
}
