import type { UnifiedPhoto } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { getManualPhotos } from "./manualPhotos";
import { deduplicatePhotos } from "./kthFilter";

const CACHE_SCHEMA_VERSION = 8;
const DECADES = [0, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

/**
 * Load ALL photos across every decade for search purposes.
 * Pulls from api_cache (already fetched API results) + curated_photos + manual photos.
 * Results are cached in memory for the session.
 */
let cachedAll: UnifiedPhoto[] | null = null;
let cacheTimestamp = 0;
const MEMORY_CACHE_MS = 5 * 60 * 1000; // 5 min

export async function fetchAllPhotosForSearch(): Promise<UnifiedPhoto[]> {
  if (cachedAll && Date.now() - cacheTimestamp < MEMORY_CACHE_MS) {
    return cachedAll;
  }

  const [apiPhotos, curatedPhotos, manualPhotos] = await Promise.all([
    loadApiCachePhotos(),
    loadAllCuratedPhotos(),
    loadAllManualPhotos(),
  ]);

  cachedAll = deduplicatePhotos([...curatedPhotos, ...manualPhotos, ...apiPhotos]);
  cacheTimestamp = Date.now();
  return cachedAll;
}

async function loadApiCachePhotos(): Promise<UnifiedPhoto[]> {
  try {
    // Fetch all cache rows that belong to the current schema version (non-search entries)
    const { data, error } = await supabase
      .from("api_cache")
      .select("data, decade")
      .like("decade", `${CACHE_SCHEMA_VERSION}:%`);

    if (error || !data) return [];

    const photos: UnifiedPhoto[] = [];
    for (const row of data) {
      // Skip search-query cache entries (contain "_q:")
      if (row.decade.includes("_q:")) continue;
      const arr = row.data as unknown as UnifiedPhoto[];
      if (Array.isArray(arr)) {
        photos.push(...arr);
      }
    }
    return photos;
  } catch {
    return [];
  }
}

async function loadAllCuratedPhotos(): Promise<UnifiedPhoto[]> {
  try {
    const { data, error } = await supabase
      .from("curated_photos")
      .select("*");

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
  } catch {
    return [];
  }
}

function loadAllManualPhotos(): UnifiedPhoto[] {
  const all: UnifiedPhoto[] = [];
  for (const decade of DECADES) {
    all.push(...getManualPhotos(decade));
  }
  return all;
}
