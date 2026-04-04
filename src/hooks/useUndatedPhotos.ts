import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Manages the set of photo IDs marked as undated in Supabase */
export function useUndatedPhotos() {
  const [undatedIds, setUndatedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("undated_api_photos")
      .select("api_id")
      .then(({ data }) => {
        if (data) setUndatedIds(new Set(data.map((r) => r.api_id)));
      });
  }, []);

  const markAsUndated = useCallback(async (apiId: string) => {
    setUndatedIds((prev) => new Set(prev).add(apiId));
    const { error } = await supabase
      .from("undated_api_photos")
      .insert({ api_id: apiId });
    if (error) {
      setUndatedIds((prev) => {
        const next = new Set(prev);
        next.delete(apiId);
        return next;
      });
    }
  }, []);

  const restoreDate = useCallback(async (apiId: string) => {
    setUndatedIds((prev) => {
      const next = new Set(prev);
      next.delete(apiId);
      return next;
    });
    const { error } = await supabase
      .from("undated_api_photos")
      .delete()
      .eq("api_id", apiId);
    if (error) {
      setUndatedIds((prev) => new Set(prev).add(apiId));
    }
  }, []);

  return { undatedIds, markAsUndated, restoreDate };
}
