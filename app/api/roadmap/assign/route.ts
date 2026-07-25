import { NextResponse } from "next/server";
import { assignRoadmap } from "@/lib/services/roadmap";

export async function POST() {
  try {
    const result = await assignRoadmap();
    const status = result.error?.code === "UNAUTHENTICATED" ? 401 : result.error ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("Roadmap assignment failed", error);
    return NextResponse.json(
      { data: null, error: { message: "We couldn't assign your roadmap. Please retry." } },
      { status: 500 }
    );
  }
}
