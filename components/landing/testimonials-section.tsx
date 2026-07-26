"use client";

import { useState } from "react";
import { Quote, Star } from "lucide-react";
import { ReviewModal, AvatarSVG, type TestimonialData } from "./review-modal";

const testimonials: TestimonialData[] = [
  {
    name: "Nishant Singh",
    role: "3rd Year Computer Science Student",
    shortQuote:
      "CalibiAI's real-world AI applications gave me the clarity I needed to start building my own projects.",
    fullNarrative:
      "I spent over a year going through online courses and tutorials but nothing truly stuck — I could follow along but couldn't build anything independently. CalibiAI's Live Audit Engine was a game-changer for me. It analyzed my GitHub projects and gave me specific, actionable feedback on my model architecture decisions, data preprocessing pipelines, and code modularity. I was able to fix critical gaps in my approach that I didn't even know existed. After my skills were verified with a 91/100 portfolio score, the system matched me with a dynamic AI startup working on computer vision for agriculture. Within two weeks, I had an interview — and I bypassed the initial coding screen entirely because my verified portfolio spoke for itself. I'm now interning there full-time.",
    metrics: [
      { label: "Portfolio Score", value: "91/100" },
      { label: "Interviews", value: "4" },
      { label: "Offers", value: "2" },
      { label: "Time to Intern", value: "3 wks" },
    ],
    avatarId: "ai-engineer",
    gender: "male",
  },
  {
    name: "Pratik Harne",
    role: "3rd Year Computer Science Student",
    shortQuote:
      "Their hands-on demonstrations and career guidance motivated me to explore AI further.",
    fullNarrative:
      "Before CalibiAI, I had a strong theoretical foundation in machine learning from my coursework, but I lacked any real-world project experience. Every job posting wanted proof — actual projects with measurable impact. The CalibiAI platform gave me structured challenges that mimicked real startup problems. I built an NLP pipeline for sentiment analysis on regional language reviews, and the AI audit system verified every aspect: model accuracy, inference time, code quality, and documentation. The detailed feedback helped me iterate quickly. When a health-tech startup saw my verified profile, they reached out directly. I went from zero interviews to two offers in under a month. The mentorship and career guidance throughout the process was exceptional.",
    metrics: [
      { label: "Portfolio Score", value: "88/100" },
      { label: "Projects Built", value: "6" },
      { label: "Offers Received", value: "2" },
      { label: "Time to Hired", value: "4 wks" },
    ],
    avatarId: "cs-grad",
    gender: "male",
  },
  {
    name: "Nisha Pawar",
    role: "3rd Year AI & Data Science Student",
    shortQuote:
      "The workshop introduced us to the latest AI tools, practical use cases shaping the future.",
    fullNarrative:
      "As a data science student, I was always surrounded by theory but never had the opportunity to apply advanced techniques to real datasets. CalibiAI changed that completely. The platform exposed me to production-level ML workflows — from feature engineering at scale to model deployment with monitoring. I built a recommendation engine for an e-commerce dataset that achieved 89% accuracy, and the Live Audit Engine gave me credit for every optimization I made. What impressed me most was how the system didn't just verify the output — it assessed my problem-solving approach, data handling decisions, and code architecture. This comprehensive verification gave employers real confidence in my skills. I received a direct offer from a fintech startup looking for ML engineers, and they specifically mentioned my verified portfolio as the reason they fast-tracked my application.",
    metrics: [
      { label: "Portfolio Score", value: "94/100" },
      { label: "Interviews", value: "5" },
      { label: "Offers", value: "3" },
      { label: "Model Accuracy", value: "89%" },
    ],
    avatarId: "data-scientist",
    gender: "female",
  },
  {
    name: "Nidhi Chavan",
    role: "3rd Year Computer Science Student",
    shortQuote:
      "Attending CalibiAI's online AI workshop left me with greater confidence to continue my learning journey.",
    fullNarrative:
      "I was always intimidated by AI — the math, the frameworks, the sheer scope of knowledge required. CalibiAI's workshops broke everything down into manageable, practical steps. I went from being afraid to open a Jupyter notebook to building and deploying my own image classification model. The AI audit system recognized my growth trajectory and verified not just my final project, but my entire learning arc. The community aspect was invaluable — I collaborated with students from different colleges, learned from their approaches, and grew tremendously. When a Y Combinator-backed startup posted a junior ML engineer role on the platform, my verified profile made me stand out. They appreciated that my portfolio showed clear progression and real understanding, not just copy-pasted code. I'm now working on production ML systems that serve millions of users.",
    metrics: [
      { label: "Portfolio Score", value: "85/100" },
      { label: "Workshops", value: "8" },
      { label: "Interviews", value: "3" },
      { label: "Position", value: "ML Eng." },
    ],
    avatarId: "ml-student",
    gender: "female",
  },
  {
    name: "Om Khatke",
    role: "Engineering Student",
    shortQuote:
      "CalibiAI gave me a clear direction on how to begin my journey in this field.",
    fullNarrative:
      "Coming from a tier-2 engineering college, I felt like the AI/ML opportunities were reserved for students at IITs and NITs. CalibiAI leveled the playing field. The platform gave me a structured roadmap, real projects to work on, and an AI-powered system that verified my skills objectively — regardless of which college I attended. I focused on building a reinforcement learning agent for game AI, and the audit system provided incredibly detailed feedback on my reward function design, training stability, and computational efficiency. The verification badge I earned carried real weight. Two startups reached out within a week of my portfolio going live. One of them, an autonomous systems company, was specifically looking for RL engineers. I'm now their youngest team member, working on robotics simulation. CalibiAI didn't just give me direction — it gave me proof that I belonged.",
    metrics: [
      { label: "Portfolio Score", value: "87/100" },
      { label: "Projects", value: "5" },
      { label: "Companies Interested", value: "4" },
      { label: "Role", value: "RL Eng." },
    ],
    avatarId: "web-developer",
    gender: "male",
  },
];

export function TestimonialsSection() {
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<TestimonialData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (t: TestimonialData) => {
    setSelectedTestimonial(t);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTestimonial(null), 300);
  };

  return (
    <section
      id="testimonials"
      className="scroll-mt-24 relative py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-purple-400">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Voices from the{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              community
            </span>
          </h2>
          <p className="mt-4 text-base text-white/50 max-w-xl mx-auto">
            Real students, real results. See how CalibiAI transforms careers.
          </p>
        </div>

        {/* Uniform 3-column grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="glass group relative flex h-full flex-col p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
            >
              {/* Quote icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/20">
                <Quote className="h-5 w-5 text-purple-400" />
              </div>

              {/* Quote text */}
              <p className="flex-1 text-sm font-semibold leading-relaxed text-white/80">
                &ldquo;{t.shortQuote}&rdquo;
              </p>

              {/* Read full review link */}
              <button
                onClick={() => openModal(t)}
                className="mt-3 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100 duration-300 text-left"
              >
                Read full review →
              </button>

              {/* Author with 3D Avatar */}
              <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15 shadow-lg animate-avatar-breathe">
                  <AvatarSVG id={t.avatarId} gender={t.gender} size={56} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/40">
                    {t.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        testimonial={selectedTestimonial}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </section>
  );
}
