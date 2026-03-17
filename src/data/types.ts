export interface UnifiedPhoto {
  id: string;
  title: string;
  source: string;
  year: number | null;
  yearCorrected?: boolean;
  imageUrl: string | null;
  imageUrlFull: string | null;
  description: string;
  coordinate: string | null;
  subjects: string[];
  license: string;
  place: string;
  originalLink: string;
  provider: "DigitaltMuseum" | "Europeana" | "K-samsök" | "Stockholmskällan" | "Wikimedia Commons" | "Alvin";
  photographer?: string;
}
