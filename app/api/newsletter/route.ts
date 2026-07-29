import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.redirect(new URL("/blog?subscribed=invalid", request.url), 303);
    }

    // Insert into newsletter table (create if not exists)
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      { email, subscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );

    if (error && error.code !== "23505") {
      console.error("Newsletter error:", error);
    }

    return NextResponse.redirect(new URL("/blog?subscribed=success", request.url), 303);
  } catch (err) {
    console.error("Newsletter exception:", err);
    return NextResponse.redirect(new URL("/blog?subscribed=error", request.url), 303);
  }
}
