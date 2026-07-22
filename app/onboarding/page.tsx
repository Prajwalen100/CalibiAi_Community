import { redirect } from "next/navigation";
import { completeOnboarding } from "./actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AnimatedBrandLogo } from "@/components/brand-logo";
import { ScrollReveal, GlowOnHover } from "@/components/scroll-reveal";
import { Zap, ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, target_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role === "employer") {
    redirect("/employer/onboarding");
  }
  if (profile?.target_role && profile.role !== "employer") {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-500/25 via-indigo-500/15 to-purple-500/25 blur-[150px] animate-float-slow" style={{ animationDuration: '12s' }} />
        <div className="absolute top-20 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-500/15 via-pink-500/15 to-brand-400/15 blur-[120px] animate-float-slow" style={{ animationDuration: '15s', animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-gradient-to-t from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-[100px] animate-float-slow" style={{ animationDuration: '18s', animationDelay: '4s' }} />
      </div>

      {/* Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      <ScrollReveal direction="up" delay={200} className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center w-full max-w-3xl">
          <GlowOnHover color="brand" intensity="normal" className="group">
            <AnimatedBrandLogo size="xl" />
          </GlowOnHover>
          
          <div className="flex items-center gap-2 rounded-full bg-brand-50/50 px-4 py-1.5 text-xs font-bold text-brand-700 backdrop-blur-md shadow-sm dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-900/30 border border-brand-200/50 dark:border-brand-900/30 animate-fade-in-up delay-200">
            <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            <Zap className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Verified AI Profiles + Real Placement Outcomes</span>
          </div>
        </div>

        {/* Onboarding Form */}
        <div className="w-full max-w-3xl">
          <ScrollReveal direction="up" delay={100} className="text-center mb-8">
            <p className="font-semibold text-brand-600 dark:text-brand-400">Onboarding</p>
            <h1 className="mt-2 text-3xl font-black text-primary sm:text-4xl">Create your first verified roadmap.</h1>
            <p className="mt-3 text-secondary">CalibiAI uses your target role and quick skill check to generate a structured plan. The model returns strict JSON that is validated before saving.</p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <form action={completeOnboarding} className="glass-panel-strong p-6 sm:p-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full name</label>
                  <input className="input mt-1" name="full_name" required defaultValue={user.user_metadata.full_name ?? ""} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input mt-1" name="phone" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">College</label>
                  <input className="input mt-1" name="college" />
                </div>
                <div>
                  <label className="label">Graduation year</label>
                  <input className="input mt-1" name="grad_year" type="number" />
                </div>
                <div>
                  <label className="label">Branch</label>
                  <input className="input mt-1" name="branch" />
                </div>
              </div>
              <div>
                <label className="label">Target role</label>
                <select className="input mt-1" name="target_role">
                  {["Gen AI Engineer", "AI Engineer", "AI-ML Engineer", "Data Scientist", "AI Automation Engineer"].map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Current level</label>
                <select className="input mt-1" name="level">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="label">Quick task: link or describe one project you have built</label>
                <textarea className="input mt-1" name="task_one" rows={3} />
              </div>
              <div>
                <label className="label">Quick task: describe an AI concept you can explain clearly</label>
                <textarea className="input mt-1" name="task_two" rows={3} />
              </div>
              <button className="btn-primary w-full" type="submit">
                <span className="flex items-center justify-center gap-2">
                  Generate roadmap
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </form>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300} className="mt-6">
            <div className="glass-panel p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-primary">Next step:</p>
                  <p className="mt-1 text-sm text-secondary">
                    After generating your roadmap you can{' '}
                    <a href="/community/profile/avatar" className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline">
                      pick your community avatar
                    </a>{' '}
                    so people can spot you in posts, squads, and events.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </ScrollReveal>
    </div>
  );
}