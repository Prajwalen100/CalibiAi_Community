import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GeneratedRoadmap } from "@/lib/ai/schemas";
import { getStudentAccess } from "@/lib/auth/student-access";
import { Calendar, Target, Trophy, TrendingUp, Zap, BookOpen, CheckCircle2, Clock, ChevronRight, Sparkles, FileText, ArrowRight } from "lucide-react";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import { STATIC_BLOG_POSTS, toBlogPost, type BlogPost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

type AssignedRoadmapDay = {
  day: number;
  week?: number;
  title: string;
  objectives?: string[];
  topics?: string[];
  estimated_time?: string;
  difficulty?: string;
  practical_task?: string;
  mini_project?: string;
  assignment?: string;
  expected_outcome?: string;
  skills_gained?: string[];
  resources?: {
    youtube?: { title: string; channel: string; url: string }[];
    docs?: { title: string; url: string }[];
  };
  has_quiz?: boolean;
};

type WeeklyTarget = {
  week: number;
  title: string;
  focus: string;
  days: number[];
  keyTopics: string[];
  milestones: string[];
};

type StoredRoadmap = Partial<GeneratedRoadmap> & {
  days?: AssignedRoadmapDay[];
  weeklyTargets?: WeeklyTarget[];
  roadmap?: {
    title?: string;
    role?: string;
    level?: string;
    total_days?: number;
  };
  totalDays?: number;
  totalWeeks?: number;
  assessment_score?: number;
  personalization?: {
    focus_skills?: string[];
    strong_skills?: string[];
    weak_skill_days?: number[];
  };
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; onboarding?: string }>;
}) {
  const params = await searchParams;
  const { submitted, onboarding } = params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin?mode=sign-in");

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) redirect("/employer/dashboard");
  if (!access.canAccessStudentArea) redirect(access.nextPath);

  const [
    { data: profile },
    { data: score },
    { data: roadmap },
    { data: projects },
    { data: recentProgress },
    { data: roadmapMiniProjects },
    { data: blogData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("scores").select("*").eq("user_id", user.id).single(),
    supabase.from("roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("projects").select("id,title,ai_score,verified,complexity_tier,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("roadmap_progress").select("module_id,day,status").eq("user_id", user.id).order("day", { ascending: true }).limit(5),
    supabase
      .from("roadmap_task_assessments")
      .select("id,user_roadmap_id,day,task_description,submission_language,score,points_awarded,ai_enriched,created_at")
      .eq("user_id", user.id)
      .eq("task_type", "mini_project")
      .eq("passed", true)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    // Robust fetch for Admin CMS blogs — same logic as /blog page
    supabase
      .from("posts")
      .select("id,author_id,slug,title,excerpt,body,status,category,read_time_minutes,cover_image_url,tags,featured,published_at,created_at,updated_at")
      .eq("type", "blog")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const publishedBlogs: BlogPost[] = (blogData ?? []).map((row) => toBlogPost(row as Record<string, unknown>));

  const plan = roadmap?.generated_plan as StoredRoadmap | undefined;
  const days = plan?.days ?? [];
  const weeklyTargets = plan?.weeklyTargets ?? [];
  const totalDays = plan?.totalDays ?? days.length;
  const totalWeeks = plan?.totalWeeks ?? Math.ceil(days.length / 7);
  const assessmentScore = plan?.assessment_score ?? 0;
  const miniProjectKeys = new Set<string>();
  const bestRoadmapMiniProjects = (roadmapMiniProjects ?? []).filter((project) => {
    const key = `${project.user_roadmap_id}:${project.day}`;
    if (miniProjectKeys.has(key)) return false;
    miniProjectKeys.add(key);
    return true;
  }).slice(0, 6);

  // Get current day's progress
  const currentDay = recentProgress?.find(p => p.status === "not_started")?.day ?? 
    recentProgress?.find(p => p.status === "in_progress")?.day ?? 1;
  const currentWeek = Math.ceil(currentDay / 7);

  // Build weekly progress summary
  const completedDays = recentProgress?.filter(p => p.status === "completed").length ?? 0;
  const weekProgress = weeklyTargets.map(week => ({
    ...week,
    completedDays: recentProgress?.filter(p => week.days.includes(p.day) && p.status === "completed").length ?? 0,
    totalDays: week.days.length,
    isCurrentWeek: week.week === currentWeek,
  }));

  // Get today's focus (current day or next available)
  const todayFocus = days.find(d => d.day === currentDay);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-semibold text-brand-700">
            {onboarding === "complete" ? "🎉 Welcome to CalibiAI!" : "Dashboard"}
          </p>
          <h1 className="mt-2 text-3xl font-black">Your Learning Journey</h1>
          {plan?.roadmap?.title && (
            <p className="mt-1 text-slate-600">
              {plan.roadmap.title} • {plan.roadmap.level} Level
            </p>
          )}
        </div>
        {profile?.username ? (
          <Link href={`/p/${profile.username}`} className="btn-secondary">
            View public profile
          </Link>
        ) : null}
      </div>

      {/* Success banner for completed onboarding */}
      {onboarding === "complete" && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="font-bold">🎉 Onboarding Complete!</p>
          <p className="mt-1">Your personalized 45-day roadmap has been assigned based on your assessment score ({assessmentScore}%).</p>
        </div>
      )}

      {/* Personalized Greeting + Motivation */}
      <div className="mt-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <DashboardGreeting name={profile?.full_name?.split(" ")[0] ?? profile?.username ?? "Student"} />
          <p className="mt-2 max-w-xl text-brand-100">&quot;Every expert was once a beginner. The only way to learn is to build, fail, and iterate.&quot;</p>
          <div className="mt-4 flex items-center gap-3">
            <Link href="/roadmap" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25 transition backdrop-blur-sm">
              Continue Learning <Zap className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/submit" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50 transition">
              Submit Project <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>


      {/* Score and Assessment Result */}
      {submitted === "1" && (
        <div className="mt-4 rounded-2xl border border-signal/30 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Project submitted successfully!</p>
          <p className="mt-1">CalibiAI Assistant has reviewed your project. Your updated score is reflected below.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">CalibiAI Score</p>
            <p className="text-2xl font-black">{score?.total ?? assessmentScorePoints(score?.total)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Assessment Score</p>
            <p className="text-2xl font-black">{assessmentScore}%</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Days Completed</p>
            <p className="text-2xl font-black">{completedDays} / {totalDays}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Current Week</p>
            <p className="text-2xl font-black">Week {currentWeek} of {totalWeeks}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Reading Engagement</p>
            <p className="text-2xl font-black">{Math.round((score?.reading_pts ?? 0) / 1)}%</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Quiz Performance</p>
            <p className="text-2xl font-black">{Math.round((score?.quizzes_pts ?? 0) / 1)}%</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Left Column - Today's Focus & Weekly Targets */}
        <div className="space-y-5">
          {/* Today's Focus */}
          {todayFocus && (
            <div className="card">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <Zap className="h-4 w-4" />
                Today&apos;s Focus
              </div>
              <div className="mt-3">
                <p className="text-lg font-bold">Day {todayFocus.day}: {todayFocus.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {todayFocus.skills_gained?.map((skill, i) => (
                    <span key={i} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                  {todayFocus.estimated_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {todayFocus.estimated_time}
                    </span>
                  )}
                  {todayFocus.has_quiz && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Quiz included
                    </span>
                  )}
                </div>
                {todayFocus.expected_outcome && (
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold">Goal:</span> {todayFocus.expected_outcome}
                  </p>
                )}
              </div>
              <Link 
                href={`/roadmap/day/${todayFocus.day}`}
                className="btn-primary mt-4 w-full justify-center"
              >
                Start Today&apos;s Learning
              </Link>
            </div>
          )}

          {/* Weekly Targets */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <Target className="h-4 w-4" />
                Weekly Targets
              </div>
              <span className="text-xs text-slate-500">{totalWeeks} weeks total</span>
            </div>
            <div className="mt-4 space-y-3">
              {weekProgress.slice(0, 4).map((week) => (
                <div 
                  key={week.week} 
                  className={`rounded-xl border p-3 transition-all ${
                    week.isCurrentWeek 
                      ? "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20" 
                      : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        week.completedDays === week.totalDays
                          ? "bg-emerald-100 text-emerald-700"
                          : week.isCurrentWeek
                            ? "bg-brand-100 text-brand-700"
                            : "bg-slate-100 text-slate-600"
                      }`}>
                        {week.completedDays === week.totalDays ? "✓" : week.week}
                      </span>
                      <span className="font-semibold">{week.title}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {week.completedDays}/{week.totalDays} days
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div 
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${(week.completedDays / week.totalDays) * 100}%` }}
                      />
                    </div>
                  </div>
                  {week.isCurrentWeek && week.keyTopics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {week.keyTopics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {weekProgress.length > 4 && (
              <Link 
                href="/roadmap" 
                className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600"
              >
                View all weeks <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Your Projects */}
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Your Projects</p>
              <Link href="/dashboard/submit" className="text-sm font-semibold text-brand-700 hover:text-brand-600">
                + Submit new
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {(projects ?? []).map((project) => (
                <div key={project.id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{project.title}</p>
                    {project.verified && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="font-medium text-brand-700">AI Score: {project.ai_score ?? "—"}</span>
                    <span className="capitalize text-slate-500">{String(project.complexity_tier ?? "beginner")}</span>
                  </div>
                </div>
              ))}

              {bestRoadmapMiniProjects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-violet-600">AI Lab · Day {project.day}</p>
                      <p className="mt-1 line-clamp-2 font-semibold">{project.task_description}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Verified
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-bold text-violet-700 dark:text-violet-300">AI Score: {project.score}/100</span>
                    <span className="uppercase text-slate-500">{project.submission_language}</span>
                    {project.points_awarded > 0 && <span className="font-bold text-amber-600">+{project.points_awarded} points</span>}
                  </div>
                </div>
              ))}

              {(projects?.length ?? 0) === 0 && bestRoadmapMiniProjects.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">No projects yet. Complete a roadmap mini project in the AI Lab to publish your first project!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Daily Tasks */}
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Recommended next actions</p>
            <Link href="/roadmap" className="text-sm font-semibold text-brand-700 hover:text-brand-600">
              Full roadmap
            </Link>
          </div>
          
          <div className="mt-4 space-y-4">
            {days.slice(0, 8).map((day) => {
              const isCompleted = recentProgress?.some(p => p.day === day.day && p.status === "completed");
              const isCurrent = day.day === currentDay;
              
              return (
                <Link
                  key={day.day}
                  href={`/roadmap/day/${day.day}`}
                  className={`group block rounded-2xl border p-4 transition-all hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-sm ${
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : isCurrent
                        ? "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20"
                        : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : isCurrent
                          ? "bg-brand-100 text-brand-700"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {isCompleted ? "✓" : day.day}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold group-hover:text-brand-700">
                        {day.title}
                        {isCurrent && <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">Today</span>}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {day.skills_gained?.slice(0, 2).map((skill, i) => (
                          <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {skill}
                          </span>
                        ))}
                        {day.estimated_time && (
                          <span className="flex items-center gap-0.5 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {day.estimated_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-brand-500" />
                  </div>
                </Link>
              );
            })}
          </div>

          {days.length > 8 && (
            <Link href="/roadmap" className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600">
              View all {days.length} days <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Blog Tab / Latest Insights for Students */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <p className="text-sm font-semibold text-slate-500">Student Portal • Blog</p>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600">
            View all blogs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publishedBlogs.length > 0 ? (
            publishedBlogs.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/60 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-500">{post.readTimeMinutes} min</span>
                </div>
                <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">{post.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{post.excerpt}</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-brand-600 group-hover:gap-1 transition-all">
                  Read article <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </div>
              </Link>
            ))
          ) : (
            STATIC_BLOG_POSTS.slice(0, 3).map((post, idx) => (
              <Link key={idx} href={`/blog/${post.slug}`} className="group block rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/60 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-500">{post.readTimeMinutes} min</span>
                </div>
                <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">{post.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{post.excerpt}</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-brand-600 group-hover:gap-1 transition-all">
                  Read article <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </div>
              </Link>
            ))
          )}
        </div>
            <p className="mt-3 text-xs text-center text-slate-500">Latest published articles from the <strong>Admin CMS</strong> appear here in the Student Portal. All blogs posted via /admin/blog (when published) are automatically shown in the top navigation &quot;Blog&quot; link and here.</p>
      </div>
    </section>
  );
}

function assessmentScorePoints(total: number | undefined | null): number {
  if (total === undefined || total === null) return 0;
  return total;
}
