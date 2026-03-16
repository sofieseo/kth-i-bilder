import type { UnifiedPhoto } from "./types";

const KSAMSOK_API = "https://kulturarvsdata.se/ksamsok/api";
const HITS_PER_PAGE = 500;

async function fetchKsamsokPaginated(query: string): Promise<UnifiedPhoto[]> {
  const merged: UnifiedPhoto[] = [];
  const seen = new Set<string>();
  let startRecord = 1;
  let previousFirstId: string | null = null;

  while (true) {
    const url = `${KSAMSOK_API}?method=search&hitsPerPage=${HITS_PER_PAGE}&startRecord=${startRecord}&query=${encodeURIComponent(query)}&x-api=test`;
    const res = await fetch(url);
    if (!res.ok) break;

    const text = await res.text();
    const batch = parseKsamsokXml(text);
    if (batch.length === 0) break;

    const firstId = batch[0]?.id ?? null;
    if (firstId && firstId === previousFirstId) break;
    previousFirstId = firstId;

    let addedCount = 0;
    for (const photo of batch) {
      if (!seen.has(photo.id)) {
        seen.add(photo.id);
        merged.push(photo);
        addedCount += 1;
      }
    }

    if (batch.length < HITS_PER_PAGE || addedCount === 0) break;
    startRecord += batch.length;
  }

  return merged;
}

export async function fetchKsamsok(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  try {
    const baseQueries = [
      `text=KTH AND thumbnailExists=j`,
      `text="K.T.H." AND thumbnailExists=j`,
      `text="Kungliga Tekniska Högskolan" AND thumbnailExists=j`,
      `text="Teknologiska institutet" AND thumbnailExists=j`,
    ];

    const queries = searchQuery
      ? baseQueries.map((q) => `${q.replace(" AND thumbnailExists=j", "")} AND text="${searchQuery}" AND thumbnailExists=j`)
      : baseQueries;

    const results = await Promise.all(queries.map(fetchKsamsokPaginated));

    const seen = new Set<string>();
    const deduped: UnifiedPhoto[] = [];
    for (const batch of results) {
      for (const photo of batch) {
        if (!seen.has(photo.id)) {
          seen.add(photo.id);
          deduped.push(photo);
        }
      }
    }

    return deduped;
  } catch {
    return [];
  }
}

function parseKsamsokXml(xmlText: string): UnifiedPhoto[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const records = xml.querySelectorAll("record");
  const results: UnifiedPhoto[] = [];

  const getAllByLocal = (parent: Element, localName: string): Element[] => {
    const els = parent.getElementsByTagName("*");
    const matches: Element[] = [];
    for (let j = 0; j < els.length; j++) {
      if (els[j].localName === localName) matches.push(els[j]);
    }
    return matches;
  };
  const getByLocal = (parent: Element, localName: string): Element | null =>
    getAllByLocal(parent, localName)[0] ?? null;
  const getTextByLocal = (parent: Element, localName: string): string =>
    getByLocal(parent, localName)?.textContent?.trim() ?? "";

  records.forEach((record, i) => {
    const entity = getByLocal(record, "Entity");
    if (!entity) return;

    const thumbnail = getTextByLocal(entity, "thumbnailSource");
    const lowres = getTextByLocal(entity, "lowresSource");
    const highres = getTextByLocal(entity, "highresSource");
    const title = getTextByLocal(entity, "itemLabel");
    const org = getTextByLocal(entity, "serviceOrganizationFull") || getTextByLocal(entity, "collection");
    const desc = getTextByLocal(entity, "desc");
    const link = getTextByLocal(entity, "url");

    const currentYear = new Date().getFullYear();
    const parseYears = (values: string[]): number[] =>
      values
        .flatMap((value) => Array.from(value.matchAll(/\b(1[6-9]\d{2}|20\d{2})\b/g)).map((m) => parseInt(m[1], 10)))
        .filter((yearVal) => yearVal >= 1600 && yearVal <= currentYear + 1);

    const fromTimeYears = parseYears(
      getAllByLocal(entity, "fromTime").map((el) => el.textContent?.trim() ?? ""),
    );
    const toTimeYears = parseYears(
      getAllByLocal(entity, "toTime").map((el) => el.textContent?.trim() ?? ""),
    );
    const timeLabelYears = parseYears(
      getAllByLocal(entity, "timeLabel").map((el) => el.textContent?.trim() ?? ""),
    );

    const allTemporalYears = [...fromTimeYears, ...toTimeYears, ...timeLabelYears];
    let parsedYear = allTemporalYears.length > 0 ? Math.min(...allTemporalYears) : null;

    if (parsedYear == null || parsedYear >= 2000) {
      const textYears = parseYears([title, desc, getTextByLocal(entity, "itemLabel"), getTextByLocal(entity, "name")])
        .filter((yearVal) => yearVal < 2000);
      if (textYears.length > 0) {
        parsedYear = Math.max(...textYears);
      }
    }

    if (!thumbnail && !lowres) return;

    results.push({
      id: `soch-${entity.getAttributeNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "about") || entity.getAttribute("rdf:about") || i}`,
      title: title || "Utan titel",
      source: org || "K-samsök",
      year: parsedYear && !isNaN(parsedYear) ? parsedYear : null,
      imageUrl: lowres || thumbnail,
      imageUrlFull: highres || lowres || thumbnail,
      description: desc,
      coordinate: null,
      subjects: [],
      license: "",
      place: "",
      originalLink: link,
      provider: "K-samsök" as const,
    });
  });

  return results;
}
