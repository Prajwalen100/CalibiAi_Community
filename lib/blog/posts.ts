export type BlogStatus = "draft" | "in_review" | "published";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  readTimeMinutes: number;
  status: BlogStatus;
  featured: boolean;
  tags: string[];
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  authorId?: string;
};

export const STATIC_BLOG_POSTS: BlogPost[] = [
  {
    id: "static-verified-ai-profiles",
    slug: "building-verified-ai-profiles-why-certificates-arent-enough",
    title: "Building Verified AI Profiles: Why Certificates Aren't Enough",
    excerpt:
      "Exploring the gap between traditional credentials and what startups actually need to see when hiring AI engineers.",
    body:
      "Certificates can show intent, but hiring teams need proof of applied ability. A verified AI profile combines project artifacts, reproducible demos, assessment history, and community signals into one evidence-backed story.\n\nFor students, the goal is not to collect badges. It is to ship real work, explain trade-offs, and show that they can learn quickly when tools change. For startups, this creates a faster screen: they can evaluate capability through project depth and execution rather than relying only on a resume line.\n\nCalibiAI's learning engine is designed around that principle. Assessments place learners honestly, roadmaps push daily implementation, and the Talent Score keeps progress measurable over time.",
    category: "Hiring Insights",
    readTimeMinutes: 8,
    status: "published",
    featured: true,
    tags: ["Hiring", "Profiles", "Talent Score"],
    coverImageUrl: null,
    publishedAt: "2024-01-15T00:00:00.000Z",
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "static-production-rag",
    slug: "the-anatomy-of-a-production-ready-rag-system",
    title: "The Anatomy of a Production-Ready RAG System",
    excerpt:
      "Deep dive into retrieval quality, evaluation frameworks, and the patterns that separate demos from deployed systems.",
    body:
      "A production RAG system is more than a vector database connected to an LLM. It needs ingestion quality, chunking strategy, metadata filters, retrieval evaluation, answer grounding, monitoring, and a rollback plan when content changes.\n\nTeams should measure retrieval recall before judging generated answers. They should also store source references, observe query classes, and track failure patterns. The best RAG apps look simple to users because the engineering system behind them is disciplined.\n\nLearners should practice by building a small end-to-end RAG app, adding an evaluation set, and documenting where retrieval fails.",
    category: "Technical Deep Dive",
    readTimeMinutes: 12,
    status: "published",
    featured: false,
    tags: ["RAG", "LLM", "Evaluation"],
    coverImageUrl: null,
    publishedAt: "2024-01-10T00:00:00.000Z",
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "static-workshop-placement",
    slug: "from-workshop-to-placement-a-students-journey",
    title: "From Workshop to Placement: A Student's Journey",
    excerpt:
      "How one engineering student went from zero AI experience to a verified profile and a role at a Series A startup.",
    body:
      "The fastest path from curiosity to opportunity is consistent proof. A student can begin with foundational Python, build small daily tasks, publish mini-projects, and improve based on review feedback.\n\nThe important pattern is cadence: learn, build, submit, receive feedback, and repeat. Over several weeks, this produces a portfolio that shows momentum and practical judgment.\n\nFor placement teams, that verified trail is easier to trust than a single final exam.",
    category: "Success Story",
    readTimeMinutes: 6,
    status: "published",
    featured: false,
    tags: ["Students", "Placement", "Portfolio"],
    coverImageUrl: null,
    publishedAt: "2024-01-05T00:00:00.000Z",
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-05T00:00:00.000Z",
  },
  {
    id: "static-prompt-evaluation",
    slug: "prompt-evaluation-moving-beyond-vibes",
    title: "Prompt Evaluation: Moving Beyond Vibes",
    excerpt:
      "Introducing deterministic evaluation methodologies for prompt engineering that produce measurable, auditable results.",
    body:
      "Prompt quality should not be judged only by whether one answer feels good. Teams need test cases, rubrics, regression checks, and failure examples.\n\nA useful evaluation loop includes representative inputs, expected behavior, scoring criteria, and a record of prompt changes. This makes prompt engineering closer to software engineering: observable, repeatable, and reviewable.\n\nStudents who learn this habit early become more reliable AI builders because they can explain why a prompt improved instead of simply saying it worked.",
    category: "Methodology",
    readTimeMinutes: 10,
    status: "published",
    featured: false,
    tags: ["Prompt Engineering", "Evaluation", "Testing"],
    coverImageUrl: null,
    publishedAt: "2023-12-28T00:00:00.000Z",
    createdAt: "2023-12-28T00:00:00.000Z",
    updatedAt: "2023-12-28T00:00:00.000Z",
  },
];

export function slugifyBlogTitle(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "untitled-post";
}

export function estimateReadTimeMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function normalizeTags(value: string | string[] | null | undefined) {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(raw.map((tag) => tag.trim()).filter(Boolean))].slice(0, 12);
}

export function toBlogPost(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: typeof row.slug === "string" && row.slug.length > 0 ? row.slug : slugifyBlogTitle(String(row.title ?? "Untitled")),
    title: String(row.title ?? "Untitled"),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
    category: String(row.category ?? "Education"),
    readTimeMinutes:
      typeof row.read_time_minutes === "number" && Number.isFinite(row.read_time_minutes)
        ? row.read_time_minutes
        : estimateReadTimeMinutes(String(row.body ?? "")),
    status: row.status === "draft" || row.status === "in_review" || row.status === "published" ? row.status : "draft",
    featured: Boolean(row.featured),
    tags: normalizeTags(Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : []),
    coverImageUrl: typeof row.cover_image_url === "string" && row.cover_image_url.length > 0 ? row.cover_image_url : null,
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    authorId: typeof row.author_id === "string" ? row.author_id : undefined,
  };
}
