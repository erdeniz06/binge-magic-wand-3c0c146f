ALTER TABLE public.user_shows
  ADD COLUMN IF NOT EXISTS watched_from smallint,
  ADD COLUMN IF NOT EXISTS watched_to smallint;

UPDATE public.user_shows
SET watched_from = EXTRACT(YEAR FROM completed_at)::smallint,
    watched_to = EXTRACT(YEAR FROM completed_at)::smallint
WHERE completed_at IS NOT NULL AND watched_from IS NULL;