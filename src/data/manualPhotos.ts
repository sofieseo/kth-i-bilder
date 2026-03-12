import type { UnifiedPhoto } from "./types";
import manualImages from "./manualImages.json";

interface ManualImage {
  year: number;
  title: string;
  imageUrl: string;
  imageUrlFull?: string;
  description: string;
  source: string;
  link: string;
}

export function getManualPhotos(year: number): UnifiedPhoto[] {
  const from = year;
  const to = year + 9;
  const isUndatedMode = year === 0;

  return (manualImages as ManualImage[])
    .filter((img) => {
      if (isUndatedMode) return false;
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
      subjects: [],
      license: "",
      place: "",
      originalLink: img.link,
      provider: "DigitaltMuseum" as const,
      photographer: undefined,
    }));
}
