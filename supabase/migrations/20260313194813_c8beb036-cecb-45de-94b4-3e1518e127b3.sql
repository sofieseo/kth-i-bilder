
CREATE TABLE public.hidden_api_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hidden_api_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hidden_api_photos"
  ON public.hidden_api_photos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert hidden_api_photos"
  ON public.hidden_api_photos FOR INSERT
  TO public
  WITH CHECK (true);
