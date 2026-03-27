
CREATE TABLE public.photo_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  photo_id text NOT NULL
);

ALTER TABLE public.photo_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read photo_shares" ON public.photo_shares FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert photo_shares" ON public.photo_shares FOR INSERT TO public WITH CHECK (true);
