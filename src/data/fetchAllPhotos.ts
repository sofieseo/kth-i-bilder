// Re-export the shared type so existing imports keep working
export type { UnifiedPhoto } from "./types";

import type { UnifiedPhoto } from "./types";
import { isKthRelevant, deduplicatePhotos } from "./kthFilter";
import { fetchDigitaltMuseum } from "./digitaltMuseum";
import { fetchEuropeana } from "./europeana";
import { fetchKsamsok } from "./ksamsok";
import { getCuratedPhotos } from "./curatedPhotos";
import { getManualPhotos } from "./manualPhotos";
import { fetchWikimediaCommons } from "./wikimediaCommons";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 45_000;
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CACHE_SCHEMA_VERSION = 4;

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
  const decadeKey = searchQuery
    ? `${CACHE_SCHEMA_VERSION}:${year}_q:${searchQuery}`
    : `${CACHE_SCHEMA_VERSION}:${year}`;

  // 1. Check Supabase cache first
  const cached = await readCache(decadeKey);
  if (cached) return cached;

  // 2. Cache miss – fetch from APIs
  const isUndatedMode = year === 0;
  const from = year;
  const to = year + 9;

  // Curated photos from database
  const local: UnifiedPhoto[] = [];

  if (!searchQuery) {
    const curated = await getCuratedPhotos(year);
    local.push(...curated);
    const manual = getManualPhotos(year);
    local.push(...manual);
  }

  // Build parallel remote fetches
  const sources: Promise<UnifiedPhoto[]>[] = [
    safeFetch(() => fetchDigitaltMuseum(year, searchQuery)),
    safeFetch(() => fetchEuropeana(year, searchQuery)),
    safeFetch(() => fetchKsamsok(year, searchQuery)),
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

  // Wikimedia photos first, then others
  const wikimedia = relevant.filter((p) => p.provider === "Wikimedia Commons");
  const rest = relevant.filter((p) => p.provider !== "Wikimedia Commons");

  const all = [...wikimedia, ...local, ...rest];
  const result = deduplicatePhotos(all);

  // Push photos with certain keywords to the bottom
  const DEMOTED_KEYWORDS = ["skioptikon", "prov", "föremål"];
  result.sort((a, b) => {
    const aLow = a.title.toLowerCase();
    const bLow = b.title.toLowerCase();
    const aDemoted = DEMOTED_KEYWORDS.some((kw) => aLow.includes(kw));
    const bDemoted = DEMOTED_KEYWORDS.some((kw) => bLow.includes(kw));
    if (aDemoted === bDemoted) return 0;
    return aDemoted ? 1 : -1;
  });

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
