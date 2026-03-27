import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const LIKED_KEY = "photo_likes_v1";

function getLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

export function usePhotoLikes(photoId: string, imageUrl?: string) {
  const [count, setCount] = useState<number>(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(getLikedIds().has(photoId));

    supabase
      .from("photo_likes")
      .select("id", { count: "exact", head: true })
      .eq("photo_id", photoId)
      .then(({ count: c }) => {
        setCount(c ?? 0);
      });
  }, [photoId]);

  const toggleLike = useCallback(async () => {
    if (loading) return;
    const ids = getLikedIds();

    setLoading(true);
    if (ids.has(photoId)) {
      // Unlike: delete one row
      const { data } = await supabase
        .from("photo_likes")
        .select("id")
        .eq("photo_id", photoId)
        .limit(1)
        .single();

      if (data) {
        await supabase.from("photo_likes").delete().eq("id", data.id);
        ids.delete(photoId);
        saveLikedIds(ids);
        setLiked(false);
        setCount((c) => Math.max(0, c - 1));
      }
    } else {
      // Like
      const { error } = await supabase
        .from("photo_likes")
        .insert({ photo_id: photoId, image_url: imageUrl ?? null });

      if (!error) {
        ids.add(photoId);
        saveLikedIds(ids);
        setLiked(true);
        setCount((c) => c + 1);
      }
    }
    setLoading(false);
  }, [photoId, loading]);

  return { count, liked, toggleLike, loading };
}
