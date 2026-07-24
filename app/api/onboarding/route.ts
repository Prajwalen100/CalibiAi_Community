import { NextResponse } from "next/server";
import { connectGitHub, saveStep } from "@/lib/services/onboarding";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { step?: number; profile?: unknown; role?: unknown; skippedConnect?: boolean; githubUsername?: string };
    const result = body.githubUsername ? await connectGitHub(body.githubUsername) : await saveStep({ step: body.step ?? 1, profile: body.profile, role: body.role, skippedConnect: body.skippedConnect });
    return NextResponse.json(result, { status: result.error ? (result.error.code === "UNAUTHENTICATED" ? 401 : 400) : 200 });
  } catch { return NextResponse.json({ data: null, error: { message: "Invalid request." } }, { status: 400 }); }
}
