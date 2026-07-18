"use client";

import { createBrowserClient } from "@supabase/ssr";

export function SignInButton() {
  async function signIn() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      alert("Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    const supabase = createBrowserClient(url, key);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    });
  }
  return <button onClick={signIn} className="btn-primary py-2.5">Join with Google</button>;
}
