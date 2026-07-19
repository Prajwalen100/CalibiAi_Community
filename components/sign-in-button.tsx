"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Github } from "lucide-react";

type Provider = "google" | "github";

function useSignIn() {
  return async function signIn(provider: Provider) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      alert("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const supabase = createBrowserClient(url, key);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };
}

export function SignInButton() {
  const signIn = useSignIn();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => signIn("google")} className="btn-primary py-2.5">
        Join with Google
      </button>
      <button
        onClick={() => signIn("github")}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:border-slate-300 hover:bg-slate-50"
      >
        <Github className="h-4 w-4" /> Continue with GitHub
      </button>
    </div>
  );
}

/** Renders only the GitHub button, useful in tighter spots. */
export function GitHubSignInButton() {
  const signIn = useSignIn();
  return (
    <button
      onClick={() => signIn("github")}
      className="inline-flex items-center gap-2 rounded-full bg-[#24292f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
    >
      <Github className="h-4 w-4" /> Continue with GitHub
    </button>
  );
}
