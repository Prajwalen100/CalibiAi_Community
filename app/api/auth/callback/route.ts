import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", data.user.id).single();
      if (profile?.target_role) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }
  return NextResponse.redirect(new URL("/onboarding", request.url));
}
