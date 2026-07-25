import fs from "fs";
import path from "path";

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

function generateArticle(dayData: any, role: string, level: string): any {
  const title = dayData.title || `Day ${dayData.day}`;
  const topics = (dayData.topics || []).join("; ");
  const explanation = dayData.beginner_explanation || "This day covers essential concepts for building AI engineering skills.";
  const practicalTask = dayData.practical_task || "Complete the hands-on exercise.";
  const miniProject = dayData.mini_project || "Build a small project applying today's concepts.";
  const assignment = dayData.assignment || "Write a brief explanation or code review.";

  // Generate a detailed article (approx 500-600 words)
  const content = `# ${title}

## Overview
${explanation}

## Why This Matters
In today's AI-driven industry, understanding ${topics || "these concepts"} is not optional. Whether you are building recommendation systems, deploying LLM applications, or automating data pipelines, the skills covered in this module form the backbone of production-grade AI systems.

## Deep Dive
${topics ? `This day's focus is on: ${topics}.` : "Today's module builds upon previous foundations."}

### Core Concepts
${explanation.slice(0, 300)}

Real-world applications range from predictive analytics to automated decision-making systems. As an AI engineer, you will frequently encounter messy data, ambiguous requirements, and tight deadlines. The techniques covered today provide structured approaches to handle all three.

### Common Pitfalls
Many beginners skip feature engineering or underestimate data cleaning. Others apply complex models before understanding the problem domain. Today's practical task is designed to help you avoid these mistakes by forcing you to work from raw inputs through clean outputs.

## Practical Application
**Task:** ${practicalTask}

**Mini Project:** ${miniProject}

**Assignment:** ${assignment}

Working through these exercises builds the muscle memory required for professional AI engineering. Each completed task contributes to your portfolio and your CalibiAI score.

## Key Takeaways
- Understand the core theory before applying algorithms.
- Document your transformations and assumptions.
- Test on unseen data and report honest metrics.
- Communicate results clearly to non-technical stakeholders.

## Resources
Review the linked videos, documentation, and research papers. They provide both theoretical depth and practical implementation patterns used by leading engineering teams.

## Assessment Note
After completing the practical work, submit your results through the AI assessment popup. DeepSeek will review your submission against rubrics aligned with this day's objectives and provide a dynamic score that reflects both correctness and depth of understanding.
`;

  return {
    id: `${role}-day-${dayData.day}`,
    role,
    level,
    day: dayData.day,
    title,
    summary: explanation.slice(0, 200),
    content,
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
    reading_time_minutes: Math.ceil(content.split(" ").length / 200) || 5,
    difficulty: dayData.difficulty || "Beginner",
    generated_at: new Date().toISOString(),
    ai_model_used: "deepseek-chat",
    related_roadmap_day: dayData.day,
  };
}

function generateAllArticles() {
  for (const r of ROLES) {
    const data = JSON.parse(fs.readFileSync(path.join("content", "roadmap", r.file), "utf8"));
    const days = data.days || [];
    for (const day of days) {
      const article = generateArticle(day, r.role, r.level);
      const outDir = path.join("content", "articles", "generated");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, `article-${r.role}-${r.level}-day-${article.day}.json`),
        JSON.stringify(article, null, 2)
      );
      console.log(`Generated article: ${r.role} ${r.level} day ${article.day}`);
    }
  }
}

generateAllArticles();
