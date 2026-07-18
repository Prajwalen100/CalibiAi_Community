create extension if not exists "pgcrypto";
create extension if not exists "vector";

create type public.app_role as enum ('student', 'author', 'admin');
create type public.score_tier as enum ('bronze', 'silver', 'gold', 'platinum');
create type public.post_status as enum ('draft', 'in_review', 'published');
create type public.post_type as enum ('blog', 'showcase');
create type public.artifact_status as enum ('pending', 'passed', 'flagged');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  email text,
  phone text,
  college text,
  grad_year integer,
  branch text,
  github_url text,
  linkedin_url text,
  portfolio_url text,
  target_role text,
  location text,
  availability text,
  bio text,
  role public.app_role not null default 'student',
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where user_id = auth.uid()), 'student'::public.app_role);
$$;

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  generated_plan jsonb not null,
  created_at timestamptz not null default now()
);

create table public.roadmap_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  status text not null default 'not_started',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);
create trigger roadmap_progress_updated_at before update on public.roadmap_progress for each row execute function public.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  repo_url text,
  live_url text,
  complexity_tier integer not null default 1 check (complexity_tier between 1 and 5),
  originality_status public.artifact_status not null default 'pending',
  ai_review jsonb,
  verified boolean not null default false,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  verified boolean not null default false,
  assessment_ref text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create table public.scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  projects_pts integer not null default 0,
  skills_pts integer not null default 0,
  community_pts integer not null default 0,
  completion_pts integer not null default 0,
  recognition_pts integer not null default 0,
  total integer not null default 0 check (total between 0 and 1000),
  tier public.score_tier not null default 'bronze',
  last_calculated_at timestamptz not null default now()
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  submission jsonb not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  type public.post_type not null,
  title text not null,
  body text not null,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_nonempty check (length(title) > 2 and length(body) > 0)
);
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger comments_updated_at before update on public.comments for each row execute function public.set_updated_at();

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'community',
  full_name text not null,
  email text not null,
  phone text,
  college text,
  created_at timestamptz not null default now()
);

create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mou_status text not null default 'lead',
  chapter_status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger colleges_updated_at before update on public.colleges for each row execute function public.set_updated_at();

create table public.startups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  hiring_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger startups_updated_at before update on public.startups for each row execute function public.set_updated_at();

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  startup_id uuid references public.startups(id) on delete set null,
  role text not null,
  status text not null default 'sourced',
  outcome text,
  performance_feedback jsonb,
  placed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  input_tokens_est integer not null default 0,
  output_tokens_est integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.course_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text,
  body text not null,
  embedding vector(1024),
  created_at timestamptz not null default now()
);

create view public.leaderboard as
select p.user_id, p.username, p.full_name, p.target_role, s.total, s.tier, s.last_calculated_at
from public.scores s
join public.profiles p on p.user_id = s.user_id
where p.flagged = false
order by s.total desc, s.last_calculated_at desc;

alter table public.profiles enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_progress enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.scores enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.community_members enable row level security;
alter table public.colleges enable row level security;
alter table public.startups enable row level security;
alter table public.placements enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.course_documents enable row level security;

create policy "profiles owner admin read" on public.profiles for select using (auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "profiles owner insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles owner update" on public.profiles for update using (auth.uid() = user_id or public.current_user_role() = 'admin') with check (auth.uid() = user_id or public.current_user_role() = 'admin');

create policy "own roadmaps" on public.roadmaps for all using (auth.uid() = user_id or public.current_user_role() = 'admin') with check (auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "own roadmap progress" on public.roadmap_progress for all using (auth.uid() = user_id or public.current_user_role() = 'admin') with check (auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "public verified projects read" on public.projects for select using (verified = true or auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "own project write" on public.projects for insert with check (auth.uid() = user_id);
create policy "own project update" on public.projects for update using (auth.uid() = user_id or public.current_user_role() = 'admin') with check (auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "skills readable" on public.skills for select using (true);
create policy "admin skills write" on public.skills for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "verified skills public read" on public.user_skills for select using (verified = true or auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "admin user skills write" on public.user_skills for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "scores public read" on public.scores for select using (true);
create policy "admin scores write" on public.scores for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "challenges readable" on public.challenges for select using (true);
create policy "admin challenges write" on public.challenges for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "own challenge submissions" on public.challenge_submissions for all using (auth.uid() = user_id or public.current_user_role() = 'admin') with check (auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "published posts public" on public.posts for select using (status = 'published' or auth.uid() = author_id or public.current_user_role() = 'admin');
create policy "role based post insert" on public.posts for insert with check (auth.uid() = author_id and (type = 'showcase' or public.current_user_role() in ('author', 'admin')));
create policy "author draft admin moderation" on public.posts for update using (auth.uid() = author_id or public.current_user_role() = 'admin') with check ((auth.uid() = author_id and status <> 'published') or public.current_user_role() = 'admin');
create policy "comments on published readable" on public.comments for select using (exists (select 1 from public.posts p where p.id = post_id and p.status = 'published') or auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "logged in comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "own comments update" on public.comments for update using (auth.uid() = user_id or public.current_user_role() = 'admin') with check (auth.uid() = user_id or public.current_user_role() = 'admin');
create policy "lead capture insert" on public.community_members for insert with check (true);
create policy "admin leads read" on public.community_members for select using (public.current_user_role() = 'admin');
create policy "admin colleges" on public.colleges for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "admin startups" on public.startups for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "admin placements" on public.placements for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "own ai logs insert" on public.ai_usage_logs for insert with check (auth.uid() = user_id);
create policy "admin ai logs read" on public.ai_usage_logs for select using (public.current_user_role() = 'admin');
create policy "course docs authenticated read" on public.course_documents for select using (auth.role() = 'authenticated');
create policy "admin course docs write" on public.course_documents for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
