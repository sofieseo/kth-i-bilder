import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Manages the set of admin-favorited photo IDs from Supabase */
export function useAdminFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("admin_favorites")
      .select("api_id")
      .then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((r) => r.api_id)));
      });
  }, []);

  const toggleFavorite = useCallback(async (apiId: string, imageUrl?: string) => {
    const wasFavorited = favoriteIds.has(apiId);
    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(apiId);
      else next.add(apiId);
      return next;
    });

    if (wasFavorited) {
      const { error } = await supabase
        .from("admin_favorites")
        .delete()
        .eq("api_id", apiId);
      if (error) {
        setFavoriteIds((prev) => new Set(prev).add(apiId));
      }
    } else {
      const { error } = await supabase
        .from("admin_favorites")
        .insert({ api_id: apiId, image_url: imageUrl ?? null });
      if (error) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(apiId);
          return next;
        });
      }
    }
  }, [favoriteIds]);

  return { favoriteIds, toggleFavorite };
}
