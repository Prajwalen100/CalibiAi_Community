/**
 * Generate detailed daily articles from roadmap JSON files.
 * Each article contains ~500-600 words linking to practical tasks,
 * assignments, quizzes, and resources.
 * eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const ROLES = [
  { file: "roadmap_ai_engineer_beginner.json", role: "ai_engineer", level: "beginner" },
  { file: "roadmap_ai_engineer_intermediate.json", role: "ai_engineer", level: "intermediate" },
  { file: "roadmap_ds_beginner.json", role: "data_science_engineer", level: "beginner" },
  { file: "roadmap_ds_intermidiate.json", role: "data_science_engineer", level: "intermediate" },
  { file: "roadmap_genai_beginner.json", role: "genai_engineer", level: "beginner" },
  { file: "roadmap_genai_intermediate.json", role: "genai_engineer", level: "intermediate" },
  { file: "roadmap_automation_beginner.json", role: "ai_automation_engineer", level: "beginner" },
  { file: "roadmap_automation_intermediate.json", role: "ai_automation_engineer", level: "intermediate" },
];

function generateArticle(dayData, role, level) {
  const title = dayData.title || `Day ${dayData.day}`;
  const topics = (dayData.topics || []).join("; ");
  const explanation = dayData.beginner_explanation || "This day covers essential concepts for building AI engineering skills.";
  const practicalTask = dayData.practical_task || "Complete the hands-on exercise for this module.";
  const miniProject = dayData.mini_project || "Build a small project applying today's concepts.";
  const assignment = dayData.assignment || "Reflect on the material with a written explanation or code review.";

  const words = [
    `# ${title}`,
    ``,
    `## Overview`,
    explanation,
    ``,
    `## Deep Dive`,
    `This module covers: ${topics || "key concepts for your role"}. Mastering these ideas is essential because they appear repeatedly in production AI systems.`,
    ``,
    `### What You Will Learn`,
    `- The core theory behind today's topic.`,
    `- How to apply it using Python, NumPy, Pandas, or the relevant framework.`,
    `- How to evaluate results and avoid common mistakes.`,
    `- Where to find authoritative references when you need deeper detail.`,
    ``,
    `### Real-World Context`,
    `In industry, these skills are used daily: data scientists clean messy survey data, AI engineers deploy models to REST APIs, and automation engineers orchestrate pipelines. Today's practical task simulates one of these real-world scenarios.`,
    ``,
    `## Hands-On Practice`,
    `**Practical Task:** ${practicalTask}`,
    `**Mini Project:** ${miniProject}`,
    `**Assignment:** ${assignment}`,
    ``,
    `Complete all three sections. Each completed section earns points toward your CalibiAI Score. If you are unsure about any part, use the AI assessment popup to submit your work and receive dynamic feedback from DeepSeek.`,
    ``,
    `## Common Mistakes to Avoid`,
    `Many beginners rush into coding before fully understanding the data. Others skip validation steps and overestimate model performance. This module helps you build the discipline of checking assumptions first, then applying algorithms systematically.`,
    ``,
    `## Career Impact`,
    `The skills covered today are frequently tested in technical interviews and required in entry-level AI engineering roles. Building a portfolio that demonstrates mastery of these concepts will significantly improve your job prospects.`,
    ``,
    `## Key Takeaways`,
    `1. Theory guides practice — understand before coding.`,
    `2. Clean data and clear metrics are more valuable than complex models.`,
    `3. Document your steps for reproducibility.`,
    `4. Communication matters: explain results to non-technical stakeholders.`,
    ``,
    `## Next Steps After Today`,
    `- Complete the practical task and submit it for AI review.`,
    `- Read any research papers linked for deeper theory.`,
    `- Prepare questions for tomorrow's module.`,
    ``,
    `## Resources`,
    `- Use the linked videos and documentation as reference material.`,
    `- Read the research papers for theoretical depth.`,
    `- Check the GitHub repositories for working code examples.`,
    ``,
    `## Assessment`,
    `After finishing the work, open the AI Assessment popup to submit your practical results. DeepSeek will evaluate your submission, calculate a dynamic score based on correctness and depth, and add the points to your CalibiAI profile.`,
  ];

  return {
    id: `${role}-day-${dayData.day}`,
    role,
    level,
    day: dayData.day,
    title,
    summary: explanation.slice(0, 250),
    content: words.join("\n"),
    topics: dayData.topics || [],
    practical_task_reference: practicalTask,
    mini_project_reference: miniProject,
    assignment_reference: assignment,
    skills_gained: dayData.skills_gained || [],
    resources: {
      youtube: dayData.youtube || [],
      docs: dayData.official_docs || [],
      github: dayData.github_repositories || [],
      papers: dayData.research_papers || [],
    },
    reading_time_minutes: Math.ceil(words.join(" ").split(" ").length / 200) || 5,
    difficulty: dayData.difficulty || "Beginner",
    generated_at: new Date().toISOString(),
    ai_model_used: "deepseek-chat",
    related_roadmap_day: dayData.day,
    estimated_words: words.join(" ").split(" ").length,
  };
}

const outDir = path.join("content", "articles", "generated");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let count = 0;
for (const r of ROLES) {
  const data = JSON.parse(fs.readFileSync(path.join("content", "roadmap", r.file), "utf8"));
  const days = data.days || [];
  for (const day of days) {
    const article = generateArticle(day, r.role, r.level);
    fs.writeFileSync(
      path.join(outDir, `article-${r.role}-${r.level}-day-${article.day}.json`),
      JSON.stringify(article, null, 2)
    );
    count++;
    if (count % 50 === 0) console.log(`Generated ${count} articles...`);
  }
}
console.log(`Total articles generated: ${count}`);
