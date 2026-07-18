import Link from "next/link";

const phases = [
  ["Foundation", "Python, APIs, Git, deployment basics and AI product thinking.", "⬡"],
  ["Applied AI", "Prompt engineering, Claude apps, embeddings and evaluation.", "⚡"],
  ["RAG + Agents", "PDF chat, retrieval quality, LangGraph patterns and tool use.", "🧠"],
  ["Capstone", "A deployed, reviewed project linked on the Verified AI Profile.", "🏆"],
];

export default function AcademyPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-brand-700">Academy</p>
      <h1 className="mt-2 text-4xl font-black">Roadmaps that end in proof, not certificates.</h1>
      <p className="mt-4 max-w-3xl text-slate-600">CalibiAI cohorts are designed around shipped artifacts, hands-on assessments and a deterministic score that startups can audit.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {phases.map(([title, body, icon]) => (
          <div className="card group cursor-pointer transition-all hover:border-brand-500 hover:shadow-md" key={title}>
            <span className="text-3xl">{icon}</span>
            <h2 className="mt-3 font-bold group-hover:text-brand-700">{title}</h2>
            <p className="mt-2 text-slate-600">{body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-3xl bg-ink p-8 text-white text-center">
        <h2 className="text-2xl font-black">Ready to start your journey?</h2>
        <p className="mt-2 text-slate-300">Join the community and start building verified projects today.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/community" className="btn-primary bg-brand-500 hover:bg-brand-600">Join Community</Link>
          <Link href="/onboarding" className="btn-secondary border-white/20 text-white hover:bg-white/10">Start Onboarding</Link>
        </div>
      </div>
    </section>
  );
}
