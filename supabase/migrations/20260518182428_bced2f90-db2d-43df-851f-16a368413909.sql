
CREATE TABLE public.admin_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id text NOT NULL UNIQUE,
  image_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin_favorites"
  ON public.admin_favorites FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert admin_favorites"
  ON public.admin_favorites FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update admin_favorites"
  ON public.admin_favorites FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete admin_favorites"
  ON public.admin_favorites FOR DELETE
  TO authenticated
  USING (true);
