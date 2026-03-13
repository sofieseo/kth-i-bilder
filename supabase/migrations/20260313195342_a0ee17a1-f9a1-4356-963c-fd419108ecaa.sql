CREATE POLICY "Anyone can delete hidden_api_photos"
  ON public.hidden_api_photos FOR DELETE
  TO public
  USING (true);