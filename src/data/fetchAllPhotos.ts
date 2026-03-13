// Re-export the shared type so existing imports keep working
export type { UnifiedPhoto } from "./types";

import type { UnifiedPhoto } from "./types";
import { isKthRelevant, deduplicatePhotos } from "./kthFilter";
import { fetchDigitaltMuseum } from "./digitaltMuseum";
import { fetchEuropeana } from "./europeana";
import { fetchKsamsok } from "./ksamsok";
import { getManualPhotos } from "./manualPhotos";
import { getStockholmskallanPhotos } from "./stockholmskallan";
import { fetchWikimediaCommons } from "./wikimediaCommons";

const TIMEOUT_MS = 8_000;

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

// ── Single batch fetch – returns all photos at once ────
export async function fetchAllPhotos(
  year: number,
  searchQuery?: string,
): Promise<UnifiedPhoto[]> {
  const isUndatedMode = year === 0;
  const from = year;
  const to = year + 9;

  // Synchronous / local sources
  const local: UnifiedPhoto[] = [];

  if (!isUndatedMode && !searchQuery) {
    local.push(...getStockholmskallanPhotos(year));
  }
  if (!searchQuery) {
    local.push(...getManualPhotos(year));
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
  return deduplicatePhotos(all).slice(0, 50);
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
