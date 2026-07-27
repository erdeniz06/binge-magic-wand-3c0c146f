CREATE TABLE public.tmdb_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tmdb_cache TO service_role;
ALTER TABLE public.tmdb_cache ENABLE ROW LEVEL SECURITY;
CREATE INDEX tmdb_cache_key_idx ON public.tmdb_cache (cache_key);