CREATE TABLE public.undated_api_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.undated_api_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read undated_api_photos" ON public.undated_api_photos FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert undated_api_photos" ON public.undated_api_photos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete undated_api_photos" ON public.undated_api_photos FOR DELETE TO public USING (true);