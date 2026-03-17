import type { UnifiedPhoto } from "./types";
import { supabase } from "@/integrations/supabase/client";

/** Fetch curated photos from the database, filtered by decade */
export async function getCuratedPhotos(year: number): Promise<UnifiedPhoto[]> {
  const isUndatedMode = year === 0;

  let query = supabase.from("curated_photos").select("*");

  if (isUndatedMode) {
    query = query.is("year", null);
  } else {
    const from = year;
    const to = year + 9;
    query = query.gte("year", from).lte("year", to);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    year: row.year,
    yearCorrected: row.year_corrected ?? false,
    imageUrl: row.image_url,
    imageUrlFull: row.image_url_full,
    description: row.description,
    coordinate: row.coordinate,
    subjects: row.subjects ?? [],
    license: row.license,
    place: row.place,
    originalLink: row.original_link,
    provider: row.provider as UnifiedPhoto["provider"],
    photographer: row.photographer ?? undefined,
  }));
}
