-- Persist the reading and roadmap-quiz pillars returned by the score engine.
-- The application already calculates these fields; without columns they are
-- discarded and cannot be displayed on the dashboard.
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS reading_pts integer NOT NULL DEFAULT 0
    CHECK (reading_pts BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS quizzes_pts integer NOT NULL DEFAULT 0
    CHECK (quizzes_pts BETWEEN 0 AND 100);
