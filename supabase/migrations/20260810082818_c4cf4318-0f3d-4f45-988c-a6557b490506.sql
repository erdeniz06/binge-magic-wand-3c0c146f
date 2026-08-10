CREATE TABLE public.user_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id integer NOT NULL,
  title text NOT NULL,
  poster_path text,
  status text NOT NULL DEFAULT 'watchlist',
  episodes_watched integer NOT NULL DEFAULT 0,
  total_episodes integer,
  episode_runtime integer,
  rating numeric,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, tmdb_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_shows TO authenticated;
GRANT ALL ON public.user_shows TO service_role;

ALTER TABLE public.user_shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_shows_own" ON public.user_shows FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_shows_updated_at BEFORE UPDATE ON public.user_shows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX user_shows_user_status_idx ON public.user_shows (user_id, status);