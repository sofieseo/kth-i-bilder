CREATE POLICY "Authenticated users can delete api_cache"
ON public.api_cache
FOR DELETE
TO authenticated
USING (true);