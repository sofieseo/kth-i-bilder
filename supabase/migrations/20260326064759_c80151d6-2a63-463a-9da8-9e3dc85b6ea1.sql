
CREATE TABLE public.photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_photo_likes_photo_id ON public.photo_likes (photo_id);

ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read photo_likes" ON public.photo_likes FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert photo_likes" ON public.photo_likes FOR INSERT TO public WITH CHECK (true);
