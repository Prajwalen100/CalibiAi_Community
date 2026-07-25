import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  Route,
  Sparkles,
  Users,
} from "lucide-react";
import { requireAdmin } from "./_lib/guard";
import { AdminShell } from "./_components/admin-shell";
import { EmptyState, Panel, Pill, StatCard, formatDate, formatNumber } from "./_components/ui";
import { getLearningEngineAdminData } from "./_lib/learning-engine-admin-data";
import { listAdminBlogPosts } from "@/lib/admin/blog-store";
import { getStudentDataset } from "@/lib/admin/students";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await requireAdmin("/admin");
  const [engine, blog, students] = await Promise.all([
    getLearningEngineAdminData(),
    listAdminBlogPosts(),
    getStudentDataset(),
  ]);

  const published = blog.data.filter((post) => post.status === "published");
  const recentPosts = blog.data.slice(0, 4);
  const topStudents = [...students.students].sort((a, b) => b.scoreTotal - a.scoreTotal).slice(0, 5);

  return (
    <AdminShell
      active="overview"
      eyebrow="Command center"
      title="CalibiAI admin overview"
      description="Two operational features live here: publishing blog articles to the student Blog tab, and downloading filtered student data as CSV."
      adminEmail={session.email}
      actions={
        <>
          <Link href="/admin/blog" className="admin-btn admin-btn-ghost">
            <FileText className="h-4 w-4" /> Write a post
          </Link>
          <Link href="/admin/students" className="admin-btn admin-btn-primary">
            <Download className="h-4 w-4" /> Export students
          </Link>
        </>
      }
    >
      {/* Hero */}
      <section className="admin-glass-strong overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8">
            <Pill tone="info" icon={Sparkles}>
              Admin build
            </Pill>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight admin-title sm:text-4xl">
              Publish articles and export learner data from one light, glass control room.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 admin-muted">
              Blog posts written here appear under the <strong>Blog</strong> tab in the student navigation with title,
              author, reading time, body, image, tags and links. Student records stay filterable by active status,
              college, role and score, and download as a CSV file in one click.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/admin/blog" className="admin-btn admin-btn-primary">
                Open Blog CMS <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/admin/students" className="admin-btn admin-btn-ghost">
                Open Student Data <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="border-t border-white/70 bg-white/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <p className="admin-eyebrow">Live counts</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniTile value={published.length} label="Published posts" />
              <MiniTile value={blog.data.length - published.length} label="Drafts / review" />
              <MiniTile value={students.totals.all} label="Students" />
              <MiniTile value={students.totals.active} label="Active now" />
            </div>
            <p className="mt-4 text-[11px] leading-5 admin-faint">
              Blog store: {blog.store === "supabase" ? "Supabase public.posts" : "local JSON fallback"}. Student store:{" "}
              {students.source === "supabase" ? "Supabase profiles + scores" : "unavailable"}.
            </p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Published articles" value={published.length} detail="Visible on /blog" accent="emerald" />
        <StatCard icon={Users} label="Registered students" value={students.totals.all} detail={`${students.totals.withPhone} with a phone number`} accent="brand" />
        <StatCard icon={ClipboardCheck} label="Assessment questions" value={formatNumber(engine.totals.assessmentQuestions)} detail={`${engine.totals.assessmentBanks} role banks audited`} accent="violet" />
        <StatCard icon={Route} label="Roadmap days" value={formatNumber(engine.totals.roadmapDays)} detail={`${engine.totals.roadmapFiles} JSON files`} accent="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Recent blog activity"
          description="Latest articles created from this portal."
          icon={FileText}
          action={
            <Link href="/admin/blog" className="admin-btn admin-btn-ghost admin-btn-sm">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {recentPosts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No posts yet"
              description="Create your first article in the Blog CMS and publish it to the student Blog tab."
              action={
                <Link href="/admin/blog" className="admin-btn admin-btn-primary admin-btn-sm">
                  Write a post
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {recentPosts.map((post) => (
                <div key={post.id} className="admin-glass-soft flex items-start justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-bold admin-title">{post.title}</p>
                    <p className="mt-0.5 text-[11px] admin-faint">
                      {post.authorName ?? "CalibiAI Team"} · {post.readTimeMinutes} min ·{" "}
                      {formatDate(post.publishedAt ?? post.updatedAt ?? post.createdAt)}
                    </p>
                  </div>
                  {post.status === "published" ? (
                    <Pill tone="ok">Live</Pill>
                  ) : post.status === "in_review" ? (
                    <Pill tone="info">Review</Pill>
                  ) : (
                    <Pill tone="warn">Draft</Pill>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Top learners by score"
          description="Snapshot of the highest CalibiAI Scores in the export dataset."
          icon={Users}
          action={
            <Link href="/admin/students" className="admin-btn admin-btn-ghost admin-btn-sm">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {topStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No student records"
              description={
                students.error ??
                "Student rows appear as soon as learners sign in and their Supabase profile is created."
              }
            />
          ) : (
            <div className="space-y-2.5">
              {topStudents.map((student, index) => (
                <div key={student.userId} className="admin-glass-soft flex items-center gap-3 p-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold admin-title">{student.fullName}</p>
                    <p className="truncate text-[11px] admin-faint">{student.college ?? student.email ?? "—"}</p>
                  </div>
                  <span className="text-sm font-black admin-title">{student.scoreTotal}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="What this portal owns"
        description="Scope stays deliberately tight so learner-facing flows are untouched."
        icon={CheckCircle2}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScopeCard
            icon={FileText}
            title="Blog posting"
            detail="Title, authored by, reading time, body, image, tags and links → published to the student Blog tab."
          />
          <ScopeCard
            icon={Download}
            title="Student CSV export"
            detail="Name, email, phone, college, role, score and status, filtered then downloaded as .csv."
          />
          <ScopeCard
            icon={BookOpenCheck}
            title="Content audit"
            detail="Read-only verification of the assessment banks and 45-day roadmap JSON files."
          />
          <ScopeCard
            icon={Database}
            title="System map"
            detail="API catalog, Supabase tables and the deterministic Talent Score contract."
          />
        </div>
      </Panel>
    </AdminShell>
  );
}

function MiniTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="admin-glass-soft p-3.5">
      <p className="text-2xl font-black admin-title">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold admin-faint">{label}</p>
    </div>
  );
}

function ScopeCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
}) {
  return (
    <div className="admin-glass-soft p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-sky-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-3 font-black admin-title">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 admin-muted">{detail}</p>
    </div>
  );
}
