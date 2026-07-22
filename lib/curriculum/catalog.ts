import fs from "fs";
import path from "path";

const PHASES_ROOT = path.join(process.cwd(), "phases");

export type CurriculumModuleMeta = {
  id: string;
  phaseId: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  type: string | null;
  time: string | null;
  languages: string | null;
  hasQuiz: boolean;
  hasCode: boolean;
  path: string;
};

export type CurriculumPhase = {
  id: string;
  order: number;
  title: string;
  summary: string;
  moduleCount: number;
  modules: CurriculumModuleMeta[];
  accent: string;
};

export type CurriculumModuleDetail = CurriculumModuleMeta & {
  content: string;
  objectives: string[];
  prev: { phaseId: string; slug: string; title: string } | null;
  next: { phaseId: string; slug: string; title: string } | null;
};

const ACCENTS = [
  "from-brand-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
  "from-fuchsia-500 to-violet-600",
  "from-lime-500 to-emerald-600",
  "from-blue-500 to-indigo-600",
  "from-orange-500 to-red-500",
];

function humanizeSlug(slug: string) {
  return slug
    .replace(/^\d+-/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseOrder(dirName: string) {
  const m = dirName.match(/^(\d+)/);
  return m ? Number(m[1]) : 999;
}

function extractMeta(md: string, fallbackTitle: string) {
  const lines = md.split("\n");
  let title = fallbackTitle;
  let summary = "";
  let type: string | null = null;
  let time: string | null = null;
  let languages: string | null = null;
  const objectives: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 80); i++) {
    const line = lines[i] ?? "";
    if (line.startsWith("# ") && title === fallbackTitle) {
      title = line.replace(/^#\s+/, "").trim();
    } else if (line.startsWith("> ") && !summary) {
      summary = line.replace(/^>\s+/, "").trim();
    } else if (/\*\*Type:\*\*/i.test(line)) {
      type = line.replace(/.*\*\*Type:\*\*\s*/i, "").trim();
    } else if (/\*\*Time:\*\*/i.test(line)) {
      time = line.replace(/.*\*\*Time:\*\*\s*/i, "").trim();
    } else if (/\*\*Languages:\*\*/i.test(line)) {
      languages = line.replace(/.*\*\*Languages:\*\*\s*/i, "").trim();
    }
  }

  const objIdx = lines.findIndex((l) => /^##\s+Learning Objectives/i.test(l));
  if (objIdx >= 0) {
    for (let i = objIdx + 1; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (/^##\s+/.test(line)) break;
      const m = line.match(/^[-*]\s+(.+)/);
      if (m) objectives.push(m[1].trim());
    }
  }

  if (!summary) {
    const para = lines.find(
      (l) =>
        l.trim().length > 40 &&
        !l.startsWith("#") &&
        !l.startsWith(">") &&
        !l.startsWith("**") &&
        !l.startsWith("```") &&
        !l.startsWith("-") &&
        !l.startsWith("|")
    );
    summary = para?.trim().slice(0, 180) ?? "";
  }

  return { title, summary, type, time, languages, objectives };
}

function readPhaseReadme(phaseDir: string, fallback: string) {
  const readme = path.join(phaseDir, "README.md");
  if (!fs.existsSync(readme)) return { title: fallback, summary: "" };
  try {
    const md = fs.readFileSync(readme, "utf8");
    const titleMatch = md.match(/^#\s+(.+)$/m);
    const summaryMatch = md.match(/^>\s+(.+)$/m);
    return {
      title: titleMatch?.[1]?.trim() ?? fallback,
      summary: summaryMatch?.[1]?.trim() ?? "",
    };
  } catch {
    return { title: fallback, summary: "" };
  }
}

function listDirs(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort((a, b) => parseOrder(a) - parseOrder(b) || a.localeCompare(b));
}

function moduleDocPath(phaseId: string, moduleSlug: string) {
  return path.join(PHASES_ROOT, phaseId, moduleSlug, "docs", "en.md");
}

function loadModuleMeta(phaseId: string, moduleSlug: string): CurriculumModuleMeta | null {
  const docPath = moduleDocPath(phaseId, moduleSlug);
  if (!fs.existsSync(docPath)) return null;

  let md = "";
  try {
    md = fs.readFileSync(docPath, "utf8");
  } catch {
    return null;
  }

  const fallback = humanizeSlug(moduleSlug);
  const meta = extractMeta(md, fallback);
  const moduleRoot = path.join(PHASES_ROOT, phaseId, moduleSlug);

  return {
    id: `${phaseId}/${moduleSlug}`,
    phaseId,
    slug: moduleSlug,
    order: parseOrder(moduleSlug),
    title: meta.title,
    summary: meta.summary,
    type: meta.type,
    time: meta.time,
    languages: meta.languages,
    hasQuiz: fs.existsSync(path.join(moduleRoot, "quiz.json")),
    hasCode: fs.existsSync(path.join(moduleRoot, "code")),
    path: docPath,
  };
}

let cachedCatalog: CurriculumPhase[] | null = null;

export function getCurriculumCatalog(): CurriculumPhase[] {
  if (cachedCatalog) return cachedCatalog;
  if (!fs.existsSync(PHASES_ROOT)) {
    cachedCatalog = [];
    return cachedCatalog;
  }

  const phaseDirs = listDirs(PHASES_ROOT);
  const phases: CurriculumPhase[] = [];

  for (let i = 0; i < phaseDirs.length; i++) {
    const phaseId = phaseDirs[i]!;
    const phaseDir = path.join(PHASES_ROOT, phaseId);
    const fallbackTitle = humanizeSlug(phaseId);
    const { title, summary } = readPhaseReadme(phaseDir, fallbackTitle);
    const moduleDirs = listDirs(phaseDir);
    const modules: CurriculumModuleMeta[] = [];

    for (const mod of moduleDirs) {
      const meta = loadModuleMeta(phaseId, mod);
      if (meta) modules.push(meta);
    }

    if (modules.length === 0) continue;

    phases.push({
      id: phaseId,
      order: parseOrder(phaseId),
      title,
      summary,
      moduleCount: modules.length,
      modules,
      accent: ACCENTS[i % ACCENTS.length]!,
    });
  }

  cachedCatalog = phases;
  return phases;
}

export function getPhase(phaseId: string): CurriculumPhase | null {
  return getCurriculumCatalog().find((p) => p.id === phaseId) ?? null;
}

export function getModuleDetail(phaseId: string, moduleSlug: string): CurriculumModuleDetail | null {
  const catalog = getCurriculumCatalog();
  const flat: CurriculumModuleMeta[] = catalog.flatMap((p) => p.modules);
  const idx = flat.findIndex((m) => m.phaseId === phaseId && m.slug === moduleSlug);
  if (idx < 0) return null;

  const current = flat[idx]!;
  let content = "";
  try {
    content = fs.readFileSync(current.path, "utf8");
  } catch {
    content = `# ${current.title}\n\nContent unavailable.`;
  }

  const meta = extractMeta(content, current.title);
  const prevMod = idx > 0 ? flat[idx - 1]! : null;
  const nextMod = idx < flat.length - 1 ? flat[idx + 1]! : null;

  return {
    ...current,
    title: meta.title || current.title,
    summary: meta.summary || current.summary,
    type: meta.type ?? current.type,
    time: meta.time ?? current.time,
    languages: meta.languages ?? current.languages,
    content,
    objectives: meta.objectives,
    prev: prevMod
      ? { phaseId: prevMod.phaseId, slug: prevMod.slug, title: prevMod.title }
      : null,
    next: nextMod
      ? { phaseId: nextMod.phaseId, slug: nextMod.slug, title: nextMod.title }
      : null,
  };
}

export function getCurriculumStats() {
  const catalog = getCurriculumCatalog();
  const modules = catalog.reduce((n, p) => n + p.moduleCount, 0);
  return { phases: catalog.length, modules };
}

/** Lightweight markdown → safe-ish HTML for lesson docs (server-side). */
export function renderLessonMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";
  let inBlockquote = false;

  const flushList = () => {
    if (inList) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
    }
  };
  const flushQuote = () => {
    if (inBlockquote) {
      html.push("</blockquote>");
      inBlockquote = false;
    }
  };

  const inline = (text: string) => {
    let t = escapeHtml(text);
    t = t.replace(/`([^`]+)`/g, "<code class=\"md-inline-code\">$1</code>");
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    t = t.replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>'
    );
    return t;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";

    if (raw.startsWith("```")) {
      if (!inCode) {
        flushList();
        flushQuote();
        inCode = true;
        codeLang = raw.slice(3).trim();
        codeBuf = [];
      } else {
        html.push(
          `<pre class="md-code" data-lang="${escapeHtml(codeLang)}"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`
        );
        inCode = false;
        codeLang = "";
        codeBuf = [];
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }

    if (/^---+$/.test(raw.trim())) {
      flushList();
      flushQuote();
      html.push('<hr class="md-hr" />');
      continue;
    }

    const h = raw.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      flushList();
      flushQuote();
      const level = h[1]!.length;
      const id = slugify(h[2]!);
      html.push(`<h${level} id="${id}" class="md-h${level}">${inline(h[2]!)}</h${level}>`);
      continue;
    }

    if (raw.startsWith("> ")) {
      flushList();
      if (!inBlockquote) {
        html.push('<blockquote class="md-quote">');
        inBlockquote = true;
      }
      html.push(`<p>${inline(raw.slice(2))}</p>`);
      continue;
    }
    if (inBlockquote && raw.trim() === "") {
      flushQuote();
      continue;
    }
    if (inBlockquote && !raw.startsWith(">")) {
      flushQuote();
    }

    const ul = raw.match(/^[-*]\s+(.+)$/);
    if (ul) {
      flushQuote();
      if (!inList || listType !== "ul") {
        flushList();
        html.push('<ul class="md-ul">');
        inList = true;
        listType = "ul";
      }
      html.push(`<li>${inline(ul[1]!)}</li>`);
      continue;
    }

    const ol = raw.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      flushQuote();
      if (!inList || listType !== "ol") {
        flushList();
        html.push('<ol class="md-ol">');
        inList = true;
        listType = "ol";
      }
      html.push(`<li>${inline(ol[1]!)}</li>`);
      continue;
    }

    if (raw.trim() === "") {
      flushList();
      continue;
    }

    // Tables (simple)
    if (raw.includes("|") && lines[i + 1]?.match(/^\|?[\s:-]+\|/)) {
      flushList();
      flushQuote();
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && (lines[j] ?? "").includes("|")) {
        const row = lines[j]!;
        if (/^\|?[\s:-]+\|/.test(row)) {
          j++;
          continue;
        }
        const parts = row
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
        rows.push(parts);
        j++;
      }
      if (rows.length > 0) {
        html.push('<div class="md-table-wrap"><table class="md-table">');
        html.push("<thead><tr>" + rows[0]!.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead>");
        if (rows.length > 1) {
          html.push("<tbody>");
          for (let r = 1; r < rows.length; r++) {
            html.push("<tr>" + rows[r]!.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
          }
          html.push("</tbody>");
        }
        html.push("</table></div>");
      }
      i = j - 1;
      continue;
    }

    flushList();
    html.push(`<p class="md-p">${inline(raw)}</p>`);
  }

  flushList();
  flushQuote();
  if (inCode) {
    html.push(
      `<pre class="md-code"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`
    );
  }

  return html.join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
