-- ============================================================
-- 017_student_ai_qa
-- Persist every question a student asks the CalibiAI Assistant
-- (the "ASK to AI" flow) together with the answer, so that:
--   * the question/answer count is saved (not stuck at 0)
--   * students can revisit & re-read their past AI answers
-- ============================================================

create table if not exists public.student_ai_qa (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  question    text        not null,
  answer      text        not null,
  model       text,
  is_saved    boolean     not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_student_ai_qa_user_created
  on public.student_ai_qa (user_id, created_at desc);

alter table public.student_ai_qa enable row level security;

drop policy if exists "student_ai_qa_select_own" on public.student_ai_qa;
create policy "student_ai_qa_select_own"
  on public.student_ai_qa for select
  using (auth.uid() = user_id);

drop policy if exists "student_ai_qa_insert_own" on public.student_ai_qa;
create policy "student_ai_qa_insert_own"
  on public.student_ai_qa for insert
  with check (auth.uid() = user_id);

drop policy if exists "student_ai_qa_update_own" on public.student_ai_qa;
create policy "student_ai_qa_update_own"
  on public.student_ai_qa for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "student_ai_qa_delete_own" on public.student_ai_qa;
create policy "student_ai_qa_delete_own"
  on public.student_ai_qa for delete
  using (auth.uid() = user_id);
