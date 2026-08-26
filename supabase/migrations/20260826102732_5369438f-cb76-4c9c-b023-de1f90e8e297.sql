ALTER TABLE public.user_shows
  ADD COLUMN IF NOT EXISTS episodes_logged text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS review text;