import Link from "next/link";

const stories = [
  {
    title: "Verified Profile",
    desc: "Every skill and project on a CalibiAI profile links to auditable proof — GitHub repos, live demos, and assessment results.",
    icon: "✅",
  },
  {
    title: "Startup Placement",
    desc: "Startups hire from CalibiAI because the score is deterministic — no resume spin, only verified output.",
    icon: "🚀",
  },
  {
    title: "Hackathon Recognition",
    desc: "Challenge wins and leaderboard positions are reflected in the public profile and talent score.",
    icon: "🏆",
  },
];

export default function PlacementsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-brand-700">Placements</p>
      <h1 className="mt-2 text-4xl font-black">The CalibiAI signal is visible proof.</h1>
      <p className="mt-4 max-w-3xl text-slate-600">This page is reserved for verified placements, project wins and student profiles that link to auditable artifacts.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {stories.map((s) => (
          <div className="card" key={s.title}>
            <span className="text-3xl">{s.icon}</span>
            <h2 className="mt-3 font-bold">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 rounded-3xl border border-brand-100 bg-brand-50 p-8 text-center">
        <h2 className="text-2xl font-black text-brand-700">Are you hiring AI talent?</h2>
        <p className="mt-2 text-brand-600">Startups can browse verified profiles and hire with confidence.</p>
        <Link href="/community/jobs" className="btn-primary mt-6 inline-block">Post a Job</Link>
      </div>
    </section>
  );
}
