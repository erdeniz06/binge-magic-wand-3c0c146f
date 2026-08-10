-- 1) Public read for TMDB cache
GRANT SELECT ON public.tmdb_cache TO anon, authenticated;
CREATE POLICY "Allow public read access to tmdb_cache"
  ON public.tmdb_cache FOR SELECT TO anon, authenticated USING (true);

-- 2) user_shows extra fields
ALTER TABLE public.user_shows
  ADD COLUMN IF NOT EXISTS notify boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seasons_logged integer[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS user_shows_user_tmdb_key
  ON public.user_shows (user_id, tmdb_id);

ALTER TABLE public.user_shows DROP CONSTRAINT IF EXISTS user_shows_status_check;
ALTER TABLE public.user_shows
  ADD CONSTRAINT user_shows_status_check
  CHECK (status IN ('plan_to_watch','watchlist','watching','watched','dropped'));