"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { generatePersonalizedRoadmap } from "@/lib/ai/bedrock";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const OnboardingSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  college: z.string().optional(),
  grad_year: z.coerce.number().int().min(2020).max(2035).optional(),
  branch: z.string().optional(),
  target_role: z.enum(["Gen AI Engineer", "AI Engineer", "AI-ML Engineer", "Data Scientist", "AI Automation Engineer"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  task_one: z.string().optional(),
  task_two: z.string().optional()
});

export async function completeOnboarding(formData: FormData) {
  const parsed = OnboardingSchema.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/");
  const username = user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "-") ?? user.id.slice(0, 8);
  await supabase.from("profiles").upsert({
    user_id: user.id,
    email: user.email,
    username,
    full_name: parsed.full_name,
    phone: parsed.phone || null,
    college: parsed.college || null,
    grad_year: parsed.grad_year || null,
    branch: parsed.branch || null,
    target_role: parsed.target_role,
    role: "student"
  }, { onConflict: "user_id" });
  const roadmap = await generatePersonalizedRoadmap({ role: parsed.target_role, level: parsed.level, tasks: [parsed.task_one ?? "", parsed.task_two ?? ""].filter(Boolean) });
  await supabase.from("roadmaps").insert({ user_id: user.id, role: parsed.target_role, generated_plan: roadmap });
  await supabase.from("scores").upsert({ user_id: user.id, projects_pts: 0, skills_pts: 0, community_pts: 0, completion_pts: 0, recognition_pts: 0, total: 0, tier: "bronze" }, { onConflict: "user_id" });
  redirect("/dashboard");
}
