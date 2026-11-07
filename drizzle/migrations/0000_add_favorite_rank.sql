ALTER TABLE public.user_shows ADD COLUMN IF NOT EXISTS favorite_rank integer;

COMMENT ON COLUMN public.user_shows.favorite_rank IS 'User-chosen position in the profile Favorites list (1 = first). NULL = never ordered, sorts last.';

CREATE INDEX IF NOT EXISTS user_shows_user_favorite_rank_idx
  ON public.user_shows (user_id, favorite_rank)
  WHERE favorite_rank IS NOT NULL;