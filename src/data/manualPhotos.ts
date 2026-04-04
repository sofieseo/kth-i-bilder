import type { UnifiedPhoto } from "./types";
import manualImages from "./manualImages.json";

interface ManualImage {
  year: number | null;
  title: string;
  imageUrl?: string;
  imageUrlFull?: string;
  description: string;
  source: string;
  link: string;
  photographer?: string;
  license?: string;
  subjects?: string[];
  provider?: string;
}

function normalizeImageUrl(url?: string): string | null {
  if (!url) return null;
  if (url.endsWith(".info")) return url.slice(0, -5);
  return url;
}

function resolveManualImageUrl(img: ManualImage): string | null {
  const direct = normalizeImageUrl(img.imageUrl);
  if (direct) return direct;

  // Many Digitala Stadsmuseet entries have only a .info metadata link.
  return normalizeImageUrl(img.link);
}

export function getManualPhotos(year: number): UnifiedPhoto[] {
  const from = year;
  const to = year + 9;
  const isUndatedMode = year === 0;

  return (manualImages as ManualImage[])
    .filter((img) => {
      if (isUndatedMode) return img.year === null;
      if (img.year === null) return false;
      return img.year >= from && img.year <= to;
    })
    .map((img, i) => {
      const imageUrl = resolveManualImageUrl(img);
      const imageUrlFull = normalizeImageUrl(img.imageUrlFull) ?? imageUrl;

      return {
        id: `manual-${img.title.replace(/\s+/g, "-").toLowerCase()}-${img.year ?? "undated"}`,
        title: img.title,
        source: img.source,
        year: img.year,
        imageUrl,
        imageUrlFull,
        description: img.description,
        coordinate: null,
        subjects: img.subjects ?? [],
        license: img.license ?? "",
        place: "",
        originalLink: img.link,
        provider: (img.provider ?? "DigitaltMuseum") as UnifiedPhoto["provider"],
        photographer: img.photographer,
      };
    });
}
