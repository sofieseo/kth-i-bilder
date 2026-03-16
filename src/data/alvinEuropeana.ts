import type { UnifiedPhoto } from "./types";

const EUROPEANA_API = "https://api.europeana.eu/record/v2/search.json";
const EUROPEANA_API_KEY = "gotiatertom";

/**
 * Fetches Alvin-portal records via Europeana's API
 * using the DATA_PROVIDER filter to specifically target Alvin content.
 */
export async function fetchAlvinViaEuropeana(
  year: number,
  searchQuery?: string,
): Promise<UnifiedPhoto[]> {
  const from = year;
  const to = year + 9;
  const isUndatedMode = year === 0;

  try {
    const baseTerms =
      'KTH OR "Kungliga Tekniska Högskolan" OR "Teknologiska institutet" OR "K.T.H."';
    const queryStr = searchQuery
      ? `(${baseTerms}) AND "${searchQuery}"`
      : baseTerms;

    const qfParts = [
      `qf=${encodeURIComponent("TYPE:IMAGE")}`,
      `qf=${encodeURIComponent('DATA_PROVIDER:"Alvin"')}`,
    ];

    if (!searchQuery && !isUndatedMode) {
      qfParts.push(
        `qf=${encodeURIComponent(`YEAR:[${from} TO ${to}]`)}`,
      );
    }

    const encodedQuery = encodeURIComponent(queryStr);
    const url = `${EUROPEANA_API}?wskey=${EUROPEANA_API_KEY}&query=${encodedQuery}&${qfParts.join("&")}&rows=50&profile=standard`;

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items: any[] = data?.items ?? [];

    return items.map((item: any, i: number) => {
      const title = (item.title ?? ["Utan titel"])[0];
      const desc = (item.dcDescription ?? [""])[0];
      const metadataYear = item.year?.[0]
        ? parseInt(item.year[0], 10)
        : null;

      // Year extraction from text
      const textToScan = `${title} ${desc}`;
      const yearMatches = Array.from(
        textToScan.matchAll(/\b(1[6-9]\d{2}|20[0-2]\d)\b/g),
      )
        .map((m) => parseInt(m[1], 10))
        .filter((y) => y >= 1600 && y <= new Date().getFullYear());
      const historicalYears = yearMatches.filter((y) => y < 2000);

      let finalYear = metadataYear;
      let corrected = false;
      if (
        historicalYears.length > 0 &&
        (!metadataYear ||
          Math.abs(Math.min(...historicalYears) - metadataYear) > 15)
      ) {
        finalYear = Math.min(...historicalYears);
        corrected = true;
      }

      return {
        id: `alvin-${item.id ?? i}`,
        title,
        source: "Alvin (via Europeana)",
        year: finalYear,
        yearCorrected: corrected,
        imageUrl: item.edmPreview?.[0] ?? null,
        imageUrlFull: item.edmIsShownBy?.[0] ?? item.edmPreview?.[0] ?? null,
        description: desc,
        coordinate: null,
        subjects: item.dcSubject ?? [],
        license: item.rights?.[0] ?? "",
        place: "",
        originalLink: item.guid ?? "",
        provider: "Europeana" as const,
      };
    });
  } catch {
    return [];
  }
}
