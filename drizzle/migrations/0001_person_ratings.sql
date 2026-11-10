CREATE TABLE public.person_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  person_id integer NOT NULL,
  show_id integer NOT NULL DEFAULT 0,
  show_title text,
  rating numeric(3,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, person_id, show_id)
);
COMMENT ON COLUMN public.person_ratings.show_id IS '0 = overall rating for the person';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_ratings TO authenticated;
GRANT ALL ON public.person_ratings TO service_role;
ALTER TABLE public.person_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.person_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.person_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.person_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.person_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);