import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStudentAccess } from "@/lib/auth/student-access";
import { SignInPageClient } from "./sign-in-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: "sign-up" | "sign-in" }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { mode: rawMode } = await searchParams;
  const mode: "sign-up" | "sign-in" = rawMode === "sign-in" ? "sign-in" : "sign-up";

  // Always render the sign-in form so users can reach login even if a stale session exists.
  // (Previously this auto-redirected logged-in users straight to the student dashboard/portal.)
  // The client component + dashboard will handle post-login routing and onboarding redirects.
  return <SignInPageClient mode={mode} />;
}
