
-- Create api_cache table for caching museum API results
CREATE TABLE public.api_cache (
  decade TEXT NOT NULL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (public data)
CREATE POLICY "Anyone can read api_cache"
  ON public.api_cache FOR SELECT
  USING (true);

-- Allow anonymous insert/update (upsert from client)
CREATE POLICY "Anyone can insert api_cache"
  ON public.api_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update api_cache"
  ON public.api_cache FOR UPDATE
  USING (true);
