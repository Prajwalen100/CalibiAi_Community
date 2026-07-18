import { redirect } from "next/navigation";
import { completeOnboarding } from "./actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-semibold text-brand-700">Onboarding</p>
      <h1 className="mt-2 text-3xl font-black">Create your first verified roadmap.</h1>
      <p className="mt-3 text-slate-600">CalibiAI uses your target role and quick skill check to generate a structured plan. The model returns strict JSON that is validated before saving.</p>
      <form action={completeOnboarding} className="mt-8 grid gap-5 rounded-3xl border border-slate-200 p-6">
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Full name</label><input className="input mt-1" name="full_name" required defaultValue={user.user_metadata.full_name ?? ""} /></div><div><label className="label">Phone</label><input className="input mt-1" name="phone" /></div></div>
        <div className="grid gap-4 sm:grid-cols-3"><div><label className="label">College</label><input className="input mt-1" name="college" /></div><div><label className="label">Graduation year</label><input className="input mt-1" name="grad_year" type="number" /></div><div><label className="label">Branch</label><input className="input mt-1" name="branch" /></div></div>
        <div><label className="label">Target role</label><select className="input mt-1" name="target_role">{["Gen AI Engineer", "AI Engineer", "AI-ML Engineer", "Data Scientist", "AI Automation Engineer"].map((role) => <option key={role}>{role}</option>)}</select></div>
        <div><label className="label">Current level</label><select className="input mt-1" name="level"><option>beginner</option><option>intermediate</option><option>advanced</option></select></div>
        <div><label className="label">Quick task: link or describe one project you have built</label><textarea className="input mt-1" name="task_one" rows={3} /></div>
        <div><label className="label">Quick task: describe an AI concept you can explain clearly</label><textarea className="input mt-1" name="task_two" rows={3} /></div>
        <button className="btn-primary" type="submit">Generate roadmap</button>
      </form>
    </section>
  );
}
