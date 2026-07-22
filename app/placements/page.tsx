import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, BriefcaseBusiness } from "lucide-react";

const jobs = [
  { title: "Junior AI Engineer", company: "Nova Labs", location: "Bengaluru · Hybrid", compensation: "₹8–12 LPA", skills: "Python · RAG · FastAPI", match: 92, interview: "High" },
  { title: "GenAI Product Intern", company: "Orbit Systems", location: "Remote · India", compensation: "₹35,000/month", skills: "LLMs · Prompting · React", match: 84, interview: "Good" },
  { title: "ML Engineering Fellow", company: "Kiteworks", location: "Pune · On-site", compensation: "₹6–9 LPA", skills: "PyTorch · MLOps · SQL", match: 78, interview: "Good" },
];
const gigs = [
  { title: "Build a support chatbot", client: "Early-stage startup", budget: "₹25k–40k", skills: "LangChain · APIs", time: "2–3 weeks" },
  { title: "Evaluate LLM responses", client: "Research team", budget: "₹800/hour", skills: "Python · Evaluation", time: "Flexible" },
  { title: "Landing page with AI demo", client: "Indie founder", budget: "₹15k–25k", skills: "Next.js · UX", time: "1–2 weeks" },
];

export default function PlacementsPage() {
  return <main className="container py-12 sm:py-16">
    <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="font-bold text-brand-600">Student opportunities</p><h1 className="mt-2 heading-1 text-primary">Find your next opportunity.</h1><p className="mt-4 max-w-2xl body-lg text-secondary">Jobs and freelance gigs matched to your verified CalibiAI profile — with the proof hiring teams actually review.</p></div><Link href="/employer" className="btn-secondary">I&apos;m an employer <ArrowRight className="h-4 w-4" /></Link></div>
    <div className="mt-10 flex gap-2 border-b border-slate-200 dark:border-slate-800"><a href="#jobs" className="border-b-2 border-brand-500 px-4 py-3 text-sm font-bold text-brand-600">Jobs</a><a href="#freelance" className="px-4 py-3 text-sm font-bold text-secondary">Freelance gigs</a></div>
    <section id="jobs" className="mt-8 space-y-4">{jobs.map(j=><article className="card" key={j.title}><div className="flex flex-wrap justify-between gap-4"><div><div className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-brand-500"/><h2 className="text-xl font-bold text-primary">{j.title}</h2></div><p className="mt-1 text-sm text-secondary">{j.company} · <MapPin className="inline h-3.5 w-3.5"/> {j.location}</p></div><button className="btn-primary py-2.5">Apply now</button></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-4"><div><p className="text-subtle">Compensation</p><b className="text-primary">{j.compensation}</b></div><div><p className="text-subtle">Role skills</p><b className="text-primary">{j.skills}</b></div><div><p className="text-subtle">Skill match</p><b className="text-emerald-600">{j.match}%</b></div><div><p className="text-subtle">Interview probability</p><b className="text-primary">{j.interview}</b></div></div><div className="mt-4 flex items-center gap-2 text-xs text-secondary"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> JD includes responsibilities, required skills, location, salary and a profile-based match score.</div></article>)}</section>
    <section id="freelance" className="mt-16"><h2 className="heading-2 text-primary">Freelance gigs</h2><p className="mt-2 text-secondary">Make an offer on work that fits your skills.</p><div className="mt-6 grid gap-5 md:grid-cols-3">{gigs.map(g=><article className="card" key={g.title}><h3 className="text-lg font-bold text-primary">{g.title}</h3><p className="mt-1 text-sm text-secondary">{g.client}</p><p className="mt-5 text-sm"><span className="text-subtle">Budget</span><br/><b className="text-primary">{g.budget}</b></p><p className="mt-3 text-sm text-secondary">{g.skills} · {g.time}</p><button className="btn-outline mt-5 w-full py-2.5">Make an offer</button></article>)}</div></section>
  </main>;
}
