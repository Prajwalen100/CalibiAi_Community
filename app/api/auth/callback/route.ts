import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const intentParam = requestUrl.searchParams.get("intent");

  const cookieStore = await cookies();
  const intentCookie = cookieStore.get("calibiai_auth_intent")?.value;
  const intent = intentParam === "employer" || intentCookie === "employer" ? "employer" : "student";

  // Clear intent cookie after reading
  const clearIntent = () => {
    try {
      cookieStore.set("calibiai_auth_intent", "", { path: "/", maxAge: 0 });
    } catch {
      /* ignore */
    }
  };

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      const user = data.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, target_role")
        .eq("user_id", user.id)
        .maybeSingle();

      // Existing employer account always goes to employer flow
      if (profile?.role === "employer") {
        clearIntent();
        const { data: emp } = await supabase
          .from("employer_profiles")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle();
        return NextResponse.redirect(
          new URL(emp?.onboarding_complete ? "/employer/dashboard" : "/employer/onboarding", request.url)
        );
      }

      // Employer sign-in intent (new or converting)
      if (intent === "employer") {
        clearIntent();
        // Seed a minimal profile marker so subsequent visits know intent
        // Full company details collected on employer onboarding
        if (!profile) {
          const usernameBase =
            user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "-") ??
            user.id.slice(0, 8);
          try {
            await supabase.from("profiles").upsert(
              {
                user_id: user.id,
                email: user.email,
                username: `emp-${usernameBase}`.slice(0, 40),
                full_name:
                  (user.user_metadata?.full_name as string | undefined) ||
                  (user.user_metadata?.name as string | undefined) ||
                  null,
                role: "employer",
                target_role: "Employer",
              },
              { onConflict: "user_id" }
            );
          } catch {
            /* role enum may not include employer yet — onboarding will retry */
          }
        } else if (profile.role !== "employer") {
          // User had a student profile — do not silently convert; send to employer onboarding
          // which will set role=employer when they complete company form
        }
        return NextResponse.redirect(new URL("/employer/onboarding", request.url));
      }

      // Student flow
      clearIntent();
      if (profile?.target_role && profile.role !== "employer") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // No code — maybe email password redirect with intent already sessioned
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, target_role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (intent === "employer" || profile?.role === "employer") {
        clearIntent();
        if (profile?.role === "employer") {
          const { data: emp } = await supabase
            .from("employer_profiles")
            .select("onboarding_complete")
            .eq("user_id", user.id)
            .maybeSingle();
          return NextResponse.redirect(
            new URL(emp?.onboarding_complete ? "/employer/dashboard" : "/employer/onboarding", request.url)
          );
        }
        return NextResponse.redirect(new URL("/employer/onboarding", request.url));
      }

      clearIntent();
      if (profile?.target_role) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  } catch {
    /* fall through */
  }

  clearIntent();
  return NextResponse.redirect(
    new URL(intent === "employer" ? "/employer/signin?mode=sign-in" : "/signin?mode=sign-in", request.url)
  );
}
