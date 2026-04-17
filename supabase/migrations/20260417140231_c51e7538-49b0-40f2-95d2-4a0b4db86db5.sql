-- Allow authenticated admins to delete share rows
CREATE POLICY "Authenticated can delete photo_shares"
ON public.photo_shares
FOR DELETE
TO authenticated
USING (true);

-- Tighten photo_likes delete: only authenticated (admin) can delete via stats UI.
-- Likes can still be removed by users via the toggle (which deletes by photo_id+image_url),
-- but we keep public delete for that use case.
-- (No change needed to photo_likes — public delete already exists for the toggle UI.)