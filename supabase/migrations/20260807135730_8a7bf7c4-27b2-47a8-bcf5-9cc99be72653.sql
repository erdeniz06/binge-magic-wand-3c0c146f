ALTER TABLE public.curated_lists
  ADD COLUMN IF NOT EXISTS vote_average numeric,
  ADD COLUMN IF NOT EXISTS vote_count integer;