-- 023_verified_skills_seed.sql
-- ----------------------------------------------------------------------------
-- Seeds the `public.skills` catalog with a canonical set of role-level skills
-- so that `public.user_skills.verified = true` rows can be granted to students
-- when an assessment or AI Lab mini project proves proficiency.
--
-- Before this migration, `public.skills` was empty (admin-write only) and no
-- `user_skills` rows could be inserted, so the public profile's "Verified
-- skills" section was always empty. See `lib/learning/verified-skills.ts` for
-- the write path that uses this catalog.
--
-- Idempotent: uses `on conflict do nothing` on the unique `name` constraint,
-- so re-running this migration is safe.
-- ----------------------------------------------------------------------------

insert into public.skills (name, category) values
  -- Programming languages & core CS
  ('Python', 'Programming Languages'),
  ('Java', 'Programming Languages'),
  ('SQL', 'Programming Languages'),
  ('JSON', 'Programming Languages'),

  -- Backend & APIs
  ('Backend Development', 'Backend & APIs'),
  ('REST APIs', 'Backend & APIs'),
  ('System Design Basics', 'Backend & APIs'),
  ('Webhooks', 'Backend & APIs'),

  -- Cloud & DevOps
  ('Docker', 'Cloud & DevOps'),
  ('AWS Fundamentals', 'Cloud & DevOps'),
  ('AI Deployment', 'Cloud & DevOps'),
  ('Git', 'Cloud & DevOps'),

  -- AI / ML core
  ('Machine Learning', 'AI / ML Core'),
  ('Deep Learning', 'AI / ML Core'),
  ('Statistics', 'AI / ML Core'),
  ('Feature Engineering', 'AI / ML Core'),
  ('Model Evaluation', 'AI / ML Core'),
  ('Data Visualization', 'AI / ML Core'),

  -- Python data stack
  ('NumPy', 'Python Data Stack'),
  ('Pandas', 'Python Data Stack'),

  -- LLMs & GenAI
  ('Large Language Models (LLMs)', 'LLMs & GenAI'),
  ('Prompt Engineering', 'LLMs & GenAI'),
  ('OpenAI APIs', 'LLMs & GenAI'),
  ('Embeddings', 'LLMs & GenAI'),
  ('Retrieval-Augmented Generation (RAG)', 'LLMs & GenAI'),
  ('Model Context Protocol (MCP)', 'LLMs & GenAI'),

  -- Vector & retrieval
  ('Vector Databases', 'Vector & Retrieval'),

  -- AI Agents & Automation
  ('AI Agents', 'AI Agents & Automation'),
  ('Automation Logic', 'AI Agents & Automation'),
  ('Zapier', 'AI Agents & Automation'),
  ('Make.com', 'AI Agents & Automation'),
  ('n8n', 'AI Agents & Automation')
on conflict (name) do nothing;
