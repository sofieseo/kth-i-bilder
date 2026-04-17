CREATE TABLE public.api_year_overrides (
  api_id text PRIMARY KEY,
  year integer NOT NULL,
  source_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_year_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read api_year_overrides"
  ON public.api_year_overrides FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated can insert api_year_overrides"
  ON public.api_year_overrides FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update api_year_overrides"
  ON public.api_year_overrides FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete api_year_overrides"
  ON public.api_year_overrides FOR DELETE TO authenticated USING (true);