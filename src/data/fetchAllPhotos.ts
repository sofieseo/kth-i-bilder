// Re-export the shared type so existing imports keep working
export type { UnifiedPhoto } from "./types";

import type { UnifiedPhoto } from "./types";
import { isKthRelevant, deduplicatePhotos } from "./kthFilter";
import { fetchDigitaltMuseum } from "./digitaltMuseum";
import { fetchEuropeana } from "./europeana";
import { fetchKsamsok } from "./ksamsok";
import { getCuratedPhotos } from "./curatedPhotos";
import { fetchWikimediaCommons } from "./wikimediaCommons";
import { fetchAlvinViaEuropeana } from "./alvinEuropeana";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 8_000;
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Wrap a promise with an AbortController-based timeout */
function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fn(controller.signal).finally(() => clearTimeout(timer));
}

/** Wraps a fetch source so timeout/errors return [] */
function safeFetch(
  fn: () => Promise<UnifiedPhoto[]>,
): Promise<UnifiedPhoto[]> {
  return withTimeout(
    () => fn(),
    TIMEOUT_MS,
  ).catch(() => [] as UnifiedPhoto[]);
}

/** Check Supabase cache for a decade */
async function readCache(decade: string): Promise<UnifiedPhoto[] | null> {
  try {
    const { data, error } = await supabase
      .from("api_cache")
      .select("data, updated_at")
      .eq("decade", decade)
      .maybeSingle();

    if (error || !data) return null;

    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > CACHE_MAX_AGE_MS) return null;

    return data.data as unknown as UnifiedPhoto[];
  } catch {
    return null;
  }
}

/** Write results to Supabase cache */
async function writeCache(decade: string, photos: UnifiedPhoto[]) {
  try {
    await supabase
      .from("api_cache")
      .upsert(
        { decade, data: photos as unknown as import("@/integrations/supabase/types").Json, updated_at: new Date().toISOString() },
        { onConflict: "decade" },
      );
  } catch {
    // Cache write failure is non-critical
  }
}

// ── Single batch fetch – returns all photos at once ────
export async function fetchAllPhotos(
  year: number,
  searchQuery?: string,
): Promise<UnifiedPhoto[]> {
  const decadeKey = searchQuery ? `${year}_q:${searchQuery}` : String(year);

  // 1. Check Supabase cache first
  const cached = await readCache(decadeKey);
  if (cached) return cached;

  // 2. Cache miss – fetch from APIs
  const isUndatedMode = year === 0;
  const from = year;
  const to = year + 9;

  // Curated photos from database
  const local: UnifiedPhoto[] = [];

  if (!isUndatedMode && !searchQuery) {
    const curated = await getCuratedPhotos(year);
    local.push(...curated);
  }

  // Build parallel remote fetches
  const sources: Promise<UnifiedPhoto[]>[] = [
    safeFetch(() => fetchDigitaltMuseum(year, searchQuery)),
    safeFetch(() => fetchEuropeana(year, searchQuery)),
    safeFetch(() => fetchKsamsok(year, searchQuery)),
    safeFetch(() => fetchAlvinViaEuropeana(year, searchQuery)),
  ];

  if (!searchQuery) {
    sources.push(safeFetch(() => fetchWikimediaCommons(year)));
  }

  const settled = await Promise.allSettled(sources);

  const remotePhotos: UnifiedPhoto[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      remotePhotos.push(...result.value);
    }
  }

  // Filter relevance & date range
  let relevant = remotePhotos.filter(isKthRelevant);
  if (!searchQuery) {
    if (isUndatedMode) {
      relevant = relevant.filter((p) => p.year == null);
    } else {
      relevant = relevant.filter((p) => {
        if (p.year == null) return false;
        return p.year >= from && p.year <= to;
      });
    }
  }

  // Prioritera källor så nya specialkällor (t.ex. Alvin via Europeana)
  // inte försvinner när vi kapar till 50 bilder.
  const wikimedia = relevant.filter((p) => p.provider === "Wikimedia Commons");
  const alvinViaEuropeana = relevant.filter(
    (p) => p.source === "Alvin (via Europeana)" || p.id.startsWith("alvin-"),
  );
  const rest = relevant.filter(
    (p) => p.provider !== "Wikimedia Commons" &&
      p.source !== "Alvin (via Europeana)" &&
      !p.id.startsWith("alvin-"),
  );

  const all = [...wikimedia, ...alvinViaEuropeana, ...local, ...rest];
  const result = deduplicatePhotos(all).slice(0, 50);

  // 3. Write to cache (fire-and-forget)
  writeCache(decadeKey, result);

  return result;
}

// Keep streaming version for backward compat (unused now but safe to keep)
export async function fetchAllPhotosStreaming(
  year: number,
  onUpdate: (photos: UnifiedPhoto[]) => void,
  searchQuery?: string,
): Promise<void> {
  const photos = await fetchAllPhotos(year, searchQuery);
  onUpdate(photos);
}
