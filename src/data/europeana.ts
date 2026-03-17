import type { UnifiedPhoto } from "./types";

const EUROPEANA_API = "https://api.europeana.eu/record/v2/search.json";
const EUROPEANA_API_KEY = "gotiatertom";
const ROWS_PER_PAGE = 100;

async function fetchEuropeanaPaginated(query: string, qfParts: string[]): Promise<any[]> {
  const items: any[] = [];
  let start = 1;
  let totalResults: number | null = null;

  while (totalResults === null || items.length < totalResults) {
    const encodedQuery = encodeURIComponent(query);
    const url = `${EUROPEANA_API}?wskey=${EUROPEANA_API_KEY}&query=${encodedQuery}&${qfParts.join("&")}&rows=${ROWS_PER_PAGE}&start=${start}&profile=standard`;
    const res = await fetch(url);
    if (!res.ok) break;

    const data = await res.json();
    const batch = (data?.items ?? []) as any[];

    if (typeof data?.totalResults === "number") {
      totalResults = data.totalResults;
    }

    if (batch.length === 0) break;

    items.push(...batch);
    start += batch.length;

    if (batch.length < ROWS_PER_PAGE) break;
  }

  return items;
}

export async function fetchEuropeana(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  const from = year;
  const to = year + 9;

  try {
    const typeFilter = encodeURIComponent("TYPE:IMAGE");
    const baseTerms = "KTH OR \"Kungliga Tekniska Högskolan\" OR \"Teknologiska institutet\" OR \"K.T.H.\" OR Teknis";
    const baseQueryStr = searchQuery ? `(${baseTerms}) AND "${searchQuery}"` : baseTerms;

    const isUndatedMode = year === 0;
    const textYearTerms = Array.from({ length: 10 }, (_, i) => `${from + i}`).join(" OR ");

    const requests = (searchQuery || isUndatedMode)
      ? [{ query: baseQueryStr, qfParts: [`qf=${typeFilter}`] }]
      : [
          {
            query: baseQueryStr,
            qfParts: [`qf=${typeFilter}`, `qf=${encodeURIComponent(`YEAR:[${from} TO ${to}]`)}`],
          },
          {
            query: `(${baseTerms}) AND (${textYearTerms})`,
            qfParts: [`qf=${typeFilter}`],
          },
        ];

    const responses = await Promise.all(
      requests.map(({ query, qfParts }) => fetchEuropeanaPaginated(query, qfParts)),
    );

    const seenRawIds = new Set<string>();
    const uniqueItems: any[] = [];

    for (const batch of responses) {
      for (const item of batch) {
        const key = item?.id ?? item?.guid;
        if (!key || seenRawIds.has(key)) continue;
        seenRawIds.add(key);
        uniqueItems.push(item);
      }
    }

    return uniqueItems.map((item: any, i: number) => {
      const title = (item.title ?? ["Utan titel"])[0];
      const desc = (item.dcDescription ?? [""])[0];
      const metadataYear = item.year?.[0] ? parseInt(item.year[0], 10) : null;

      const textToScan = `${title} ${desc}`;
      const yearMatches = Array.from(textToScan.matchAll(/\b(1[6-9]\d{2}|20[0-2]\d)\b/g))
        .map((m) => parseInt(m[1], 10))
        .filter((y) => y >= 1600 && y <= new Date().getFullYear());
      const historicalYears = yearMatches.filter((y) => y < 2000);

      let finalYear = metadataYear;
      let corrected = false;
      if (historicalYears.length > 0 && (!metadataYear || Math.abs(Math.min(...historicalYears) - metadataYear) > 15)) {
        finalYear = Math.min(...historicalYears);
        corrected = true;
      }

      return {
        id: `euro-${item.id ?? i}`,
        title,
        source: (item.dataProvider ?? ["Europeana"])[0],
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
