export interface HistoryResult {
  id: string;
  title: string;
  source: string;
  year: number;
  description: string;
  imageUrl?: string;
}

const sources = ["KB (Kungliga Biblioteket)", "Stockholmskällan", "Digitalt Museum", "Libris XSearch", "Nordiska Museet"];

const sampleTitles: Record<string, string[]> = {
  early: [
    "Map of Stockholm's northern districts",
    "Engraving: The Royal Institute founding",
    "Letter from Berzelius on technical education",
    "Agricultural survey of Norra Djurgården",
  ],
  mid: [
    "Photograph: Construction of KTH Main Building",
    "Stockholm city plan 1910s expansion",
    "Engineering student corps portrait",
    "Technical drawing: Campus layout proposal",
    "Newspaper clipping: Inauguration ceremony 1917",
  ],
  modern: [
    "Reactor R1 declassified documentation",
    "Student protest photographs 1968",
    "Aerial photograph of KTH campus",
    "Digital archive: KTH centennial records",
    "Urban development plan: Hagastaden connection",
  ],
};

export function fetchMockResults(year: number): Promise<HistoryResult[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const era = year < 1900 ? "early" : year < 1970 ? "mid" : "modern";
      const titles = sampleTitles[era];
      const count = 3 + Math.floor(Math.random() * 3);
      const results: HistoryResult[] = Array.from({ length: count }, (_, i) => ({
        id: `${year}-${i}`,
        title: titles[i % titles.length],
        source: sources[i % sources.length],
        year: year + Math.floor(Math.random() * 5) - 2,
        description: `A historical record from approximately ${year}, found via digital archive search.`,
      }));
      resolve(results);
    }, 400 + Math.random() * 300);
  });
}
