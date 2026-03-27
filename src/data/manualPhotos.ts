import type { UnifiedPhoto } from "./types";
import manualImages from "./manualImages.json";

interface ManualImage {
  year: number | null;
  title: string;
  imageUrl: string;
  imageUrlFull?: string;
  description: string;
  source: string;
  link: string;
  photographer?: string;
  license?: string;
  subjects?: string[];
  provider?: string;
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
    .map((img, i) => ({
      id: `manual-${i}-${img.title}`,
      title: img.title,
      source: img.source,
      year: img.year,
      imageUrl: img.imageUrl,
      imageUrlFull: img.imageUrlFull ?? img.imageUrl,
      description: img.description,
      coordinate: null,
      subjects: img.subjects ?? [],
      license: img.license ?? "",
      place: "",
      originalLink: img.link,
      provider: (img.provider ?? "DigitaltMuseum") as UnifiedPhoto["provider"],
      photographer: img.photographer,
    }));
}
