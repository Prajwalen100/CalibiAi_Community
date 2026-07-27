# CalibiAI Article Writer Guide (standing rules for all batches)

You rewrite ONLY the `content` field of course-article JSON files, turning each into an
engaging, in-depth ~2000-word technical article. Everything else in the JSON must stay
byte-for-byte identical. Your batch prompt lists the exact files and the role/level.

## Working directory
C:/Users/2321843/Downloads/CalibiAi_Community-main (4)/CalibiAi_Community-main
Article JSONs live in `content/articles/generated/`.

## Per-file workflow (STRICT)
1. Read the JSON. Extract to guide the article: `title`, `role`, `level`, `day`,
   `topics` (array — the exact subjects the article MUST cover), `summary`,
   `skills_gained`, `practical_task_reference`, `mini_project_reference`,
   `assignment_reference`. Skim `resources` so you can reference them naturally.
2. Write the Markdown article to `_tmp_articles/<basename-without-.json>.md` (Write tool).
3. Inject by running from the working directory:
   `python _article_inject.py "content/articles/generated/<file>.json" "_tmp_articles/<basename>.md"`
   It prints `OK ... (N words)` and ONLY ever changes the `content` field.
   Confirm N is 1900–2200. If N < 1900, expand and re-inject.
4. Next file.

## Article requirements (EVERY file)
- Length ~1500 words (accept 1300–1500). Hard target — never under-write.
- Topic-driven: thoroughly cover EVERY item in the `topics` array; `title` is the headline.
  Write specifically about THIS day's subject — no generic filler.
- Tone by `level`:
  - beginner: clear, plain, encouraging; define jargon on first use; motivated tier-2/tier-3
    college student new to the topic. Accessible but still technically precise and deep.
  - intermediate: assume fundamentals; go deeper into mechanics, trade-offs, production
    concerns, performance, and edge cases; more advanced code and realistic examples.
- Structure with proper Markdown: one `#` H1 (the article title), then logical `##`/`###`
  sections. Include (adapt to topic): an engaging hook/short real-world story, core concept
  explanations, worked examples, at least one relevant fenced code block WITH a language tag
  (use the language natural to the topic — Python, SQL, JSON, YAML, bash, etc.), a diagram
  where it helps (```mermaid flowchart/sequence, or clean ASCII), common mistakes/pitfalls,
  a short hands-on tie-in referencing the practical task, and a "Key takeaways" wrap-up.
- Engaging: narrative thread, concrete examples (real tools/companies where apt), analogies.
- Code must be correct and plausible; Mermaid must be valid syntax.
- Output the RAW Markdown body only — no YAML frontmatter, no JSON, no surrounding quotes.

## Role focus hints
- ai_automation_engineer: workflow/iPaaS automation (Zapier, Make.com, n8n), APIs, webhooks,
  JSON, later Python scripting and AI-in-automation / agents.
- ai_engineer: applied AI/ML engineering — Python, ML models, training/serving, APIs, MLOps,
  deployment, evaluation.
- data_science_engineer: data science — Python, NumPy, Pandas, statistics, visualization, ML,
  data cleaning, experimentation.
- genai_engineer: generative AI — LLMs, prompting, embeddings, RAG, vector databases,
  fine-tuning, agents, evaluation.

## Hard rules
- NEVER edit JSON by hand. ONLY change content via `_article_inject.py` (it guarantees other
  fields — links, resources, references, metadata — are untouched and JSON stays valid).
- If the injector prints ERROR or a non-OK line, STOP and report the file and reason — do not
  attempt manual JSON edits.
- Remove the original boilerplate style entirely (no "DeepSeek", "CalibiAI Score popup",
  "Complete all three sections" filler). Write a real article.

## Final report
Report count completed, the word count for each file, and confirm every injection printed OK.
Keep it under 200 words.
