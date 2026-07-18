const phases = [
  ["Foundation", "Python, APIs, Git, deployment basics and AI product thinking."],
  ["Applied AI", "Prompt engineering, Claude apps, embeddings and evaluation."],
  ["RAG + agents", "PDF chat, retrieval quality, LangGraph patterns and tool use."],
  ["Capstone", "A deployed, reviewed project linked on the Verified AI Profile."]
];
export default function ProgramsPage() { return <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"><p className="font-semibold text-brand-700">Programs / Academy</p><h1 className="mt-2 text-4xl font-black">Roadmaps that end in proof, not certificates.</h1><p className="mt-4 max-w-3xl text-slate-600">CalibiAI cohorts are designed around shipped artifacts, hands-on assessments and a deterministic score that startups can audit.</p><div className="mt-10 grid gap-4 md:grid-cols-2">{phases.map(([title, body]) => <div className="card" key={title}><h2 className="font-bold">{title}</h2><p className="mt-2 text-slate-600">{body}</p></div>)}</div></section>; }
