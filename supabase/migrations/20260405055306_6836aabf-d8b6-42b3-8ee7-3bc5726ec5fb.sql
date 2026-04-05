
-- hidden_api_photos: restrict INSERT to authenticated
DROP POLICY IF EXISTS "Anyone can insert hidden_api_photos" ON public.hidden_api_photos;
CREATE POLICY "Authenticated users can insert hidden_api_photos"
  ON public.hidden_api_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- hidden_api_photos: restrict DELETE to authenticated
DROP POLICY IF EXISTS "Anyone can delete hidden_api_photos" ON public.hidden_api_photos;
CREATE POLICY "Authenticated users can delete hidden_api_photos"
  ON public.hidden_api_photos FOR DELETE
  TO authenticated
  USING (true);

-- undated_api_photos: restrict INSERT to authenticated
DROP POLICY IF EXISTS "Anyone can insert undated_api_photos" ON public.undated_api_photos;
CREATE POLICY "Authenticated users can insert undated_api_photos"
  ON public.undated_api_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- undated_api_photos: restrict DELETE to authenticated
DROP POLICY IF EXISTS "Anyone can delete undated_api_photos" ON public.undated_api_photos;
CREATE POLICY "Authenticated users can delete undated_api_photos"
  ON public.undated_api_photos FOR DELETE
  TO authenticated
  USING (true);
