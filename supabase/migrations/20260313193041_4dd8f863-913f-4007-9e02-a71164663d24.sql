
CREATE TABLE public.curated_photos (
  id text PRIMARY KEY,
  title text NOT NULL,
  source text NOT NULL,
  year integer,
  year_corrected boolean NOT NULL DEFAULT false,
  image_url text,
  image_url_full text,
  description text NOT NULL DEFAULT '',
  coordinate text,
  subjects text[] NOT NULL DEFAULT '{}',
  license text NOT NULL DEFAULT '',
  place text NOT NULL DEFAULT '',
  original_link text NOT NULL DEFAULT '',
  provider text NOT NULL,
  photographer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curated_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read curated_photos"
  ON public.curated_photos FOR SELECT
  TO public
  USING (true);
