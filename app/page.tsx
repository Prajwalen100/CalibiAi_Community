import Link from "next/link";
import { CheckCircle2, ShieldCheck, Trophy, Users, Building2, GraduationCap, Briefcase } from "lucide-react";
import { LeadForm } from "@/components/lead-form";
import { TypingHeading } from "@/components/typing-heading";

const stats = [
  ["10+ Colleges", "Partnered across engineering campuses"],
  ["1000+ Students", "Mentored in applied AI engineering"],
  ["20+ Startups", "Hiring partners for verified talent"],
  ["College Network", "Building India's largest AI education ecosystem."]
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">Verified AI profile + placement outcome</p>
            <TypingHeading text="Become a verified, hire-ready applied-AI engineer." />
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">CalibiAI helps engineering students build real AI projects, pass hands-on assessments and publish a startup-trusted profile where every score point links to proof.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="#join" className="btn-primary">Join a free workshop</Link><Link href="/success-stories" className="btn-secondary">See verified placements</Link></div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([title, body]) => (
                <div key={title} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                  <p className="font-bold text-ink">{title}</p>
                  <p className="mt-1 text-xs text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card self-center bg-white/90">
            <div className="flex items-center gap-3"><ShieldCheck className="text-signal" /><p className="font-bold">What startups can verify</p></div>
            <div className="mt-6 grid gap-4">
              {["Live project links and GitHub repos", "Passed hands-on skill assessments", "Originality and integrity review status", "Current activity, decay-aware score and tier"].map((item) => <div key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-signal" /><span className="text-slate-700">{item}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl"><p className="font-semibold text-brand-700">How it works</p><h2 className="mt-2 text-3xl font-black text-ink">A flywheel built around trusted talent proof.</h2></div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[[Users, "Join community", "Start with a short workshop and role selection."], [Trophy, "Build projects", "Ship RAG apps, prompt systems and AI workflows."], [ShieldCheck, "Get verified", "Only linked, reviewed artifacts add to the CalibiAI Score."], [CheckCircle2, "Placement support", "Admins surface top-tier students for startup roles."]].map(([Icon, title, body]) => {
            const Component = Icon as typeof Users;
            return <div key={title as string} className="card"><Component className="text-brand-600" /><h3 className="mt-4 font-bold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body as string}</p></div>;
          })}
        </div>
      </section>

      <section id="join" className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div><p className="font-semibold text-brand-700">Start free</p><h2 className="mt-2 text-3xl font-black">Register for the next workshop.</h2><p className="mt-4 text-slate-600">Keep the first step lightweight. CalibiAI captures core details now and enriches the profile after Google login and onboarding.</p></div>
          <LeadForm source="workshop" />
        </div>
      </section>
    </div>
  );
}
