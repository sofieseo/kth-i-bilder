// Re-export the shared type so existing imports keep working
export type { UnifiedPhoto } from "./types";

import type { UnifiedPhoto } from "./types";
import { isKthRelevant, deduplicatePhotos } from "./kthFilter";
import { fetchDigitaltMuseum } from "./digitaltMuseum";
import { fetchEuropeana } from "./europeana";
import { fetchKsamsok } from "./ksamsok";
import { getManualPhotos } from "./manualPhotos";

// ── Streaming fetch – calls onUpdate as each source resolves ────
export async function fetchAllPhotosStreaming(
  year: number,
  onUpdate: (photos: UnifiedPhoto[]) => void,
  searchQuery?: string,
): Promise<void> {
  const accumulated: UnifiedPhoto[] = [];

  const isUndatedMode = year === 0;
  const from = year;
  const to = year + 9;

  // Immediately inject curated Stockholmskällan photos
  if (!isUndatedMode && !searchQuery) {
    const { getStockholmskallanPhotos } = await import("./stockholmskallan");
    const curated = getStockholmskallanPhotos(year);
    if (curated.length > 0) {
      accumulated.push(...curated);
      onUpdate(deduplicatePhotos(accumulated).slice(0, 50));
    }
  }

  // Inject manually curated images
  if (!searchQuery) {
    const manualPhotos = getManualPhotos(year);
    if (manualPhotos.length > 0) {
      accumulated.push(...manualPhotos);
      onUpdate(deduplicatePhotos(accumulated).slice(0, 50));
    }
  }

  const sources: Promise<UnifiedPhoto[]>[] = isUndatedMode
    ? [fetchKsamsok(year, searchQuery), fetchDigitaltMuseum(year, searchQuery), fetchEuropeana(year, searchQuery)]
    : [fetchDigitaltMuseum(year, searchQuery), fetchEuropeana(year, searchQuery), fetchKsamsok(year, searchQuery)];

  // Fetch Wikimedia Commons (no search query support – curated categories only)
  if (!searchQuery) {
    const { fetchWikimediaCommons } = await import("./wikimediaCommons");
    sources.unshift(fetchWikimediaCommons(year));
  }

  for (const promise of sources) {
    promise.then((photos) => {
      let relevant = photos.filter(isKthRelevant);
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

      // Keep Wikimedia photos visible in the top-50 mix
      const isWikimediaBatch = relevant.some((p) => p.provider === "Wikimedia Commons");
      if (isWikimediaBatch) {
        accumulated.unshift(...relevant);
      } else {
        accumulated.push(...relevant);
      }

      onUpdate(deduplicatePhotos(accumulated).slice(0, 50));
    }).catch(() => {});
  }

  await Promise.allSettled(sources);
}
