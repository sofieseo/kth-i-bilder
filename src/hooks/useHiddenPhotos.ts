import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Manages the set of hidden photo IDs from Supabase */
export function useHiddenPhotos() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("hidden_api_photos")
      .select("api_id")
      .then(({ data }) => {
        if (data) setHiddenIds(new Set(data.map((r) => r.api_id)));
      });
  }, []);

  const hidePhoto = useCallback(async (apiId: string, imageUrl?: string) => {
    setHiddenIds((prev) => new Set(prev).add(apiId));
    const { error } = await supabase
      .from("hidden_api_photos")
      .insert({ api_id: apiId, image_url: imageUrl ?? null });
    if (error) {
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(apiId);
        return next;
      });
    }
  }, []);

  const restorePhoto = useCallback(async (apiId: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(apiId);
      return next;
    });
    const { error } = await supabase
      .from("hidden_api_photos")
      .delete()
      .eq("api_id", apiId);
    if (error) {
      setHiddenIds((prev) => new Set(prev).add(apiId));
    }
  }, []);

  return { hiddenIds, hidePhoto, restorePhoto };
}
