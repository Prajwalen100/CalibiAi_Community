import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Heart,
  Quote,
  Rocket,
  Sparkles,
  Target,
  Users,
  Lightbulb,
  Handshake,
} from "lucide-react";
import { ScrollReveal, StaggerReveal, GlowOnHover, Floating } from "@/components/scroll-reveal";

const testimonials = [
  {
    quote:
      "CalibiAI conducted an AI seminar at our college, and it was one of the most practical sessions I've attended. The workshop focused on real-world AI applications, live demonstrations, and career opportunities instead of just theory. It gave me a much clearer understanding of how to start building projects in AI. I would highly recommend every student to attend a CalibiAI session.",
    name: "Nishant Singh",
    role: "3rd Year Computer Science Student",
  },
  {
    quote:
      "I attended a CalibiAI workshop and found it extremely insightful and engaging. The concepts were explained in a simple and practical way, making even advanced AI topics easy to understand. The hands-on demonstrations and career guidance motivated me to explore AI further and start building my own projects.",
    name: "Pratik Harne",
    role: "3rd Year Computer Science Student",
  },
  {
    quote:
      "CalibiAI organized an AI workshop in our college that was both informative and inspiring. The session introduced us to the latest AI tools, industry trends, and practical use cases that are shaping the future. It encouraged me to learn beyond the classroom and build skills that are relevant to the industry.",
    name: "Nisha Pawar",
    role: "3rd Year Artificial Intelligence & Data Science Student",
  },
  {
    quote:
      "I attended CalibiAI's online AI workshop, and even in virtual mode the learning experience was excellent. The session was interactive, well-structured, and packed with practical examples. I gained valuable knowledge about AI technologies and left with greater confidence to continue my learning journey.",
    name: "Nidhi Chavan",
    role: "2nd Year Information Technology Student",
  },
  {
    quote:
      "Attending the CalibiAI workshop was a great learning experience. The trainers explained AI concepts through real-world examples and live demonstrations, making the session engaging and easy to follow. It inspired me to explore AI more deeply and gave me a clear direction on how to begin my journey in this field.",
    name: "Om Khatke",
    role: "Engineering Student",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[900px] w-full max-w-7xl -translate-x-1/2 overflow-hidden opacity-50 dark:opacity-30">
        <div
          className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-500/30 via-indigo-500/20 to-purple-500/30 blur-[120px] animate-float-slow"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute top-20 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-brand-400/20 blur-[100px] animate-float-slow"
          style={{ animationDuration: "10s", animationDelay: "1s" }}
        />
      </div>
      <div className="noise-overlay" />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-50/60 px-4 py-2 text-xs font-bold text-brand-700 backdrop-blur-md dark:border-brand-900/40 dark:bg-brand-950/40 dark:text-brand-300">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <Sparkles className="h-3.5 w-3.5" />
              Building the Future of AI, One Student at a Time
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-primary sm:text-5xl lg:text-6xl">
              Why{" "}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                CalibiAI
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">
              An ecosystem where students, colleges, educators, startups, and businesses learn, build,
              innovate, and grow with practical, industry-driven AI education.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
              <GlowOnHover color="brand" intensity="normal" className="group">
                <Link
                  href="/signin?mode=sign-up"
                  className="flex h-full flex-col items-start rounded-3xl border border-brand-200/80 bg-white/90 p-6 text-left shadow-lg shadow-brand-500/10 transition-all duration-300 hover:-translate-y-1 dark:border-brand-900/50 dark:bg-slate-900/80"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-black text-primary">I&apos;m a Student</h2>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
                    Build verified AI projects, join the community, explore opportunities, and grow a
                    hire-ready profile.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs font-semibold text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Academy &amp; Resource Hub
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Community &amp; squads
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Jobs &amp; freelance gigs
                    </li>
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-600 group-hover:gap-3 dark:text-brand-400">
                    Student login / sign up <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </GlowOnHover>

              <GlowOnHover color="purple" intensity="normal" className="group">
                <Link
                  href="/employer/signin?mode=sign-up"
                  className="flex h-full flex-col items-start rounded-3xl border border-indigo-200/80 bg-white/90 p-6 text-left shadow-lg shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 dark:border-indigo-900/50 dark:bg-slate-900/80"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-black text-primary">I&apos;m an Employer</h2>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
                    Post roles, review verified student profiles, manage applications, and hire with real
                    proof.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs font-semibold text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Applications inbox
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Full candidate profiles
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Jobs &amp; freelance postings
                    </li>
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:gap-3 dark:text-indigo-400">
                    Employer login / sign up <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </GlowOnHover>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-subtle">
              <a href="#why" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
                Why CalibiAI
              </a>
              <a href="#story" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
                Our story
              </a>
              <a href="#testimonials" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
                Testimonials
              </a>
              <a href="#motto" className="rounded-full border border-slate-200 px-3 py-1.5 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
                Our motto
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* WHY / MISSION SNAPSHOT */}
      <section id="why" className="scroll-mt-24 border-t border-slate-200/60 bg-white/50 py-20 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="mx-auto max-w-3xl text-center">
            <p className="font-bold text-brand-600 dark:text-brand-400">Why CalibiAI</p>
            <h2 className="mt-2 text-3xl font-black text-primary sm:text-4xl">
              Building the Future of AI, One Student at a Time
            </h2>
            <p className="mt-4 text-secondary leading-relaxed">
              We&apos;re not just teaching Artificial Intelligence—we&apos;re building the next generation of AI
              innovators, creators, and leaders.
            </p>
          </ScrollReveal>

          <StaggerReveal staggerDelay={120} direction="up" className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Lightbulb,
                title: "From curiosity to capability",
                body: "Students had endless courses—but little direction, mentorship, or real project experience. We close that gap.",
              },
              {
                icon: Handshake,
                title: "One shared ecosystem",
                body: "Students, colleges, educators, startups, and businesses learn and grow together around practical AI.",
              },
              {
                icon: Rocket,
                title: "Industry-driven outcomes",
                body: "Every workshop, partnership, and mentorship moves us toward accessible, hands-on AI education for every aspirant.",
              },
            ].map((item) => (
              <div key={item.title} className="glass-panel p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{item.body}</p>
              </div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            <ScrollReveal direction="left" className="lg:col-span-5">
              <p className="font-bold text-brand-600 dark:text-brand-400">Our story</p>
              <h2 className="mt-2 text-3xl font-black text-primary sm:text-4xl">
                How CalibiAI began
              </h2>
              <div className="mt-8 space-y-4">
                {[
                  { year: "2024", label: "AI Consulting & Innovation Company" },
                  { year: "Campus", label: "Workshops & guest lectures nationwide" },
                  { year: "Insight", label: "Students needed direction, not more links" },
                  { year: "2026", label: "Full ecosystem for learners & industry" },
                ].map((t) => (
                  <div key={t.year} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-[10px] font-black text-white">
                        {t.year === "Campus" || t.year === "Insight" ? "•" : t.year.slice(2)}
                      </span>
                      <span className="mt-1 w-px flex-1 bg-brand-200 dark:bg-brand-900" />
                    </div>
                    <div className="pb-6">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{t.year}</p>
                      <p className="mt-1 font-semibold text-primary">{t.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={150} className="lg:col-span-7">
              <div className="glass-panel-strong space-y-5 p-6 sm:p-8 text-sm leading-relaxed text-secondary sm:text-base">
                <p>
                  CalibiAI&apos;s journey began in <strong className="text-primary">2024</strong> as an{" "}
                  <strong className="text-primary">AI Consulting &amp; Innovation Company</strong>, helping
                  startups and businesses leverage artificial intelligence to solve real-world challenges and
                  accelerate innovation.
                </p>
                <p>
                  As our founder, <strong className="text-primary">Prajwal Gulhane</strong>, started delivering
                  AI workshops and guest lectures across engineering colleges, he noticed something that stayed
                  with him. After every session, students would gather around with the same question:
                </p>
                <blockquote className="rounded-2xl border-l-4 border-brand-500 bg-brand-50/80 px-5 py-4 text-base font-semibold text-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
                  &ldquo;How do we actually learn AI and build a successful career in it?&rdquo;
                </blockquote>
                <p>
                  The problem wasn&apos;t a lack of curiosity—it was a lack of direction. Students were
                  surrounded by endless courses and tutorials but had very few opportunities to gain practical
                  experience, industry mentorship, or work on real-world AI projects.
                </p>
                <p>That realization became the turning point.</p>
                <p>
                  In <strong className="text-primary">2026</strong>, CalibiAI grew beyond consulting and
                  embraced a much larger mission—to build an ecosystem where{" "}
                  <strong className="text-primary">
                    students, colleges, educators, startups, and businesses
                  </strong>{" "}
                  come together to learn, build, innovate, and grow with AI.
                </p>
                <p>
                  Today, every workshop we conduct, every partnership we build, and every student we mentor
                  brings us one step closer to our vision of making{" "}
                  <strong className="text-primary">
                    practical, industry-driven AI education accessible to every aspiring innovator.
                  </strong>
                </p>
                <p className="font-semibold text-primary">
                  We&apos;re not just teaching Artificial Intelligence—we&apos;re building the next generation
                  of AI innovators, creators, and leaders.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="testimonials"
        className="scroll-mt-24 border-t border-slate-200/60 bg-slate-50/80 py-20 dark:border-slate-800/80 dark:bg-slate-950/50"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center">
            <p className="font-bold text-brand-600 dark:text-brand-400">Testimonials</p>
            <h2 className="mt-2 text-3xl font-black text-primary sm:text-4xl">
              Voices from the classroom
            </h2>
            <p className="mt-3 text-secondary">
              Students across engineering colleges on workshops that went beyond theory.
            </p>
          </ScrollReveal>

          <StaggerReveal staggerDelay={100} direction="up" className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((t) => (
              <article
                key={t.name}
                className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <Quote className="h-8 w-8 text-brand-400/80" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-secondary">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="font-bold text-primary">— {t.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-subtle">{t.role}</p>
                </div>
              </article>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* MOTTO */}
      <section id="motto" className="scroll-mt-24 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl sm:p-12 lg:p-16 dark:border-slate-800">
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

              <div className="relative mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                  <Heart className="h-3.5 w-3.5" />
                  Our Motto
                </div>
                <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                  Learn. Build. Lead.
                </h2>
                <p className="mt-6 text-sm leading-relaxed text-slate-300 sm:text-base">
                  At CalibiAI, we believe AI education should inspire people to{" "}
                  <strong className="text-white">create, innovate, and solve real-world problems</strong>, not
                  just earn certificates. Every learner deserves the opportunity to gain practical skills, build
                  meaningful projects, and grow with the confidence to shape the future. We are committed to
                  making AI education accessible, hands-on, and connected to industry, so every student can
                  transform curiosity into capability. Through collaboration, innovation, and continuous
                  learning, we aim to empower individuals to become creators, educators, entrepreneurs, and
                  leaders in the AI revolution.
                </p>
                <p className="mt-6 text-base font-semibold text-white sm:text-lg">
                  Together, we&apos;re not just preparing students for the future—we&apos;re empowering them to
                  build it.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/signin?mode=sign-up"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-cyan-50"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Join as Student
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/employer/signin?mode=sign-up"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <Building2 className="h-4 w-4" />
                    Join as Employer
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* PATHS RECAP */}
      <section className="border-t border-slate-200/60 py-16 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center">
            <h2 className="text-2xl font-black text-primary sm:text-3xl">Choose your path</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-secondary">
              Student tools (Academy, Community, Opportunity, Blog) unlock after student login. Employers get a
              dedicated hiring dashboard.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Floating amplitude={6} duration={5000}>
              <div className="card h-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">For students</h3>
                </div>
                <p className="mt-3 text-sm text-secondary">
                  After you sign in: Academy roadmaps, Community, Resource Hub, Opportunity board, Blog, and
                  your verified dashboard.
                </p>
                <Link href="/signin?mode=sign-in" className="btn-primary mt-5 inline-flex">
                  Student login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Floating>

            <Floating amplitude={6} duration={5500} delay={200}>
              <div className="card h-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">For employers</h3>
                </div>
                <p className="mt-3 text-sm text-secondary">
                  Company profile, post jobs &amp; gigs, applications inbox, full candidate profiles,
                  notifications, and offers—all in one employer workspace.
                </p>
                <Link href="/employer/signin?mode=sign-in" className="btn-secondary mt-5 inline-flex">
                  Employer login <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Floating>
          </div>
        </div>
      </section>
    </div>
  );
}
