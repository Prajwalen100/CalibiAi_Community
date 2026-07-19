"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Sparkles } from "lucide-react";
import { AuthComponent, type OAuthProvider } from "@/components/ui/sign-up";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

const CalibiLogo = () => (
  <div className="rounded-md bg-ink p-1.5 text-white">
    <Sparkles className="h-4 w-4" />
  </div>
);

export function SignInPageClient({ mode }: { mode: "sign-up" | "sign-in" }) {
  async function handleOAuth(provider: OAuthProvider) {
    const supabase = getSupabase();
    if (!supabase) {
      alert("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  async function handleEmailSubmit({
    email,
    password,
    mode,
  }: {
    email: string;
    password: string;
    mode: "sign-up" | "sign-in";
  }): Promise<string | void> {
    const supabase = getSupabase();
    if (!supabase) {
      return "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
    }

    if (mode === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) return error.message;
      // If email confirmation is required, `session` will be null.
      if (!data.session) {
        return "Check your inbox — we sent you a confirmation link to finish signing up.";
      }
      window.location.assign("/onboarding");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    window.location.assign("/community");
    return;
  }

  return (
    <AuthComponent
      mode={mode}
      brandName="CalibiAI"
      logo={<CalibiLogo />}
      onOAuth={handleOAuth}
      onEmailSubmit={handleEmailSubmit}
      switchHref={mode === "sign-up" ? "/signin?mode=sign-in" : "/signin?mode=sign-up"}
    />
  );
}
