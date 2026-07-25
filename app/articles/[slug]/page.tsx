import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { ArrowLeft, Clock, Target, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), "content", "articles", "generated", `article-${slug}.json`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const article = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    id: string;
    role: string;
    level: string;
    day: number;
    title: string;
    summary: string;
    content: string;
    topics: string[];
    skills_gained: string[];
    reading_time_minutes: number;
    difficulty: string;
    resources: any;
  };

  const roleTitle = article.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/roadmap/day/${article.day}`} className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Day {article.day}
      </Link>

      <article className="mt-6 rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900 sm:p-10">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-600">{roleTitle}</span>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-600">Day {article.day}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.reading_time_minutes} min read</span>
          <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {article.difficulty}</span>
        </div>

        <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">{article.title}</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">{article.summary}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {article.skills_gained.map((skill: string, i: number) => (
            <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-950/20 dark:text-brand-300">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-8 prose prose-lg max-w-none text-slate-700 dark:text-slate-300" id="article-content">
          {article.content.split("\n").map((line: string, i: number) => {
            if (line.startsWith("# ")) return <h2 key={i} className="text-2xl font-black text-slate-900 dark:text-white mt-8 mb-4">{line.replace("# ", "")}</h2>;
            if (line.startsWith("## ")) return <h3 key={i} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3">{line.replace("## ", "")}</h3>;
            if (line.startsWith("### ")) return <h4 key={i} className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-5 mb-2">{line.replace("### ", "")}</h4>;
            if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold mt-4 mb-2">{line.replace(/\*\*/g, "")}</p>;
            if (line.trim().startsWith("- ")) return <li key={i} className="ml-5 list-disc">{line.replace("- ", "")}</li>;
            if (line.trim() === "") return <br key={i} />;
            return <p key={i} className="mt-3 leading-relaxed">{line}</p>;
          })}
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const start = Date.now();
                let tracked = false;
                function sendTrack() {
                  if (tracked) return;
                  tracked = true;
                  fetch("/api/reading/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ articleId: "${article.id}", timeSpentSeconds: Math.round((Date.now() - start) / 1000) }),
                  }).catch(() => {});
                }
                window.addEventListener("beforeunload", sendTrack);
                setTimeout(sendTrack, 15000);
              })();
            `
          }}
        />

        {article.resources && (article.resources.youtube?.length || article.resources.docs?.length) && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/30">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <BookOpen className="h-5 w-5 text-brand-600" /> Related Resources
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {article.resources.youtube?.map((v: any, i: number) => (
                <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-brand-700">{v.title}</p>
                  <p className="text-sm text-slate-500">{v.channel}</p>
                </a>
              ))}
              {article.resources.docs?.map((d: any, i: number) => (
                <a key={i + (article.resources.youtube?.length || 0)} href={d.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-brand-700">{d.title}</p>
                  <p className="text-sm text-slate-500">Official Docs</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
