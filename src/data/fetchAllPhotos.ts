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
  provider: "DigitaltMuseum" | "Europeana" | "K-samsök";
}

const KTH_KEYWORDS = [
  "kth", "k.t.h.", "kungliga tekniska", "kungl. tekniska",
  "tekniska högskolan", "tekniska högskolans", "tekn. högskolan",
  "teknologiska institutet",
  "valhallavägen", "drottninggatan 95",
  "teknis", "östermalmsgatan",
];

const EXCLUDED_OTHER_UNIVERSITIES = [
  "chalmers", "lund", "luleå", "linköping", "göteborg",
];

const EXCLUDED_SOURCES = [
  "museum of far eastern antiquities",
  "östasiatiska museet",
  "museum of mediterranean and near eastern antiquities",
  "medelhavsmuseet",
];

const EXCLUDED_TERMS = [
  "världsutställning", "paris", "world exhibition", "exposition universelle",
  "uthus",
];

// Stricter keywords required for sources that have many non-KTH photos
const STRICT_KTH_KEYWORDS = [
  "kth", "k.t.h.", "kungliga tekniska", "kungl. tekniska",
];

const STRICT_SOURCES = [
  "tekniska museet",
];

function isKthRelevant(photo: UnifiedPhoto): boolean {
  const sourceLower = photo.source.toLowerCase();
  if (EXCLUDED_SOURCES.some((ex) => sourceLower.includes(ex))) return false;

  const searchable = [
    photo.title, photo.description, photo.place,
    ...photo.subjects,
  ].join(" ").toLowerCase();

  if (EXCLUDED_TERMS.some((term) => searchable.includes(term))) return false;
  if (EXCLUDED_OTHER_UNIVERSITIES.some((uni) => searchable.includes(uni))) return false;

  // For sources like Tekniska museet, require stronger KTH signal
  if (STRICT_SOURCES.some((s) => sourceLower.includes(s))) {
    return STRICT_KTH_KEYWORDS.some((kw) => searchable.includes(kw));
  }

  return KTH_KEYWORDS.some((kw) => searchable.includes(kw));
}

// ── Museum code → full name mapping ─────────────────────────────
const MUSEUM_NAMES: Record<string, string> = {
  "S-TEK": "Tekniska museet",
  "S-NM": "Nordiska museet",
  "S-NMA": "Nordiska museet",
  "S-SPV": "Statens porträttsamling / Nationalmuseum",
  "S-VGM": "Västergötlands museum",
  "S-FV": "Flygvapenmuseum",
  "S-KPS": "Kulturparken Småland",
  "S-VLM": "Värmlands museum",
  "S-SMM-VM": "Sjöhistoriska museet / Vasamuseet",
  "S-SSM": "Stockholms stadsmuseum",
  "S-SM": "Stockholms stadsmuseum",
  "S-ATA": "Antikvarisk-topografiska arkivet",
  "S-RM": "Riksmuseet",
  "S-LSH": "Livrustkammaren",
  "S-HM": "Historiska museet",
  "S-MM": "Marinmuseum",
  "S-AM": "Armémuseum",
};

function resolveMuseumName(code: string): string {
  return MUSEUM_NAMES[code] ?? code;
}

// ── DigitaltMuseum ──────────────────────────────────────────────
const DIMU_API = "https://api.dimu.org/api/solr/select";
const DIMU_IMG = "https://mm.dimu.org/image";

async function fetchDigitaltMuseum(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  const from = year;
  const to = year + 9;
  const baseTerms = "\"KTH\" OR \"Kungliga Tekniska Högskolan\" OR \"Tekniska Högskolan Stockholm\" OR \"Teknologiska institutet\" OR \"K.T.H.\"";
  const queryStr = searchQuery
    ? `(${baseTerms}) AND "${searchQuery}"`
    : baseTerms;
  const query = encodeURIComponent(queryStr);
  const fqParts = [
    "artifact.hasPictures:true",
    ...(searchQuery ? [] : [`artifact.ingress.production.fromYear:[${from} TO ${to}]`]),
  ];
  const fq = fqParts.map((f) => `fq=${encodeURIComponent(f)}`).join("&");

  const url = `${DIMU_API}?q=${query}&${fq}&wt=json&rows=100&api.key=demo`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const docs: any[] = data?.response?.docs ?? [];

    return docs.map((doc) => {
      const mediaId = doc["artifact.defaultMediaIdentifier"] ?? null;
      const uniqueId = doc["artifact.uniqueId"] ?? "";
      return {
        id: `dimu-${uniqueId || Math.random()}`,
        title: doc["artifact.ingress.title"] ?? "Utan titel",
        source: resolveMuseumName(doc["identifier.owner"] ?? "Okänd källa"),
        year: doc["artifact.ingress.production.fromYear"] ?? null,
        imageUrl: mediaId ? `${DIMU_IMG}/${mediaId}?dimension=400x400` : null,
        imageUrlFull: mediaId ? `${DIMU_IMG}/${mediaId}?dimension=1200x1200` : null,
        description: doc["artifact.ingress.classification"] ?? doc["artifact.ingress.subjects"]?.[0] ?? "",
        coordinate: doc["artifact.coordinate"] ?? null,
        subjects: doc["artifact.ingress.subjects"] ?? [],
        license: doc["artifact.ingress.license"] ?? "",
        place: doc["artifact.ingress.production.place"] ?? "",
        originalLink: uniqueId ? `https://digitaltmuseum.org/${uniqueId}` : "",
        provider: "DigitaltMuseum" as const,
      };
    });
  } catch {
    return [];
  }
}


// ── Europeana ───────────────────────────────────────────────────
const EUROPEANA_API = "https://api.europeana.eu/record/v2/search.json";
const EUROPEANA_API_KEY = "gotiatertom";

async function fetchEuropeana(_year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  try {
    const typeFilter = encodeURIComponent("TYPE:IMAGE");
    const baseTerms = "KTH OR \"Kungliga Tekniska Högskolan\" OR \"Teknologiska institutet\" OR \"K.T.H.\"";
    const queryStr = searchQuery
      ? `(${baseTerms}) AND "${searchQuery}"`
      : baseTerms;
    const query = encodeURIComponent(queryStr);
    const qfParts = [`qf=${typeFilter}`];
    const url = `${EUROPEANA_API}?wskey=${EUROPEANA_API_KEY}&query=${query}&${qfParts.join("&")}&rows=50&profile=standard`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items: any[] = data?.items ?? [];

    return items.map((item: any, i: number) => {
      const title = (item.title ?? ["Utan titel"])[0];
      const desc = (item.dcDescription ?? [""])[0];
      const metadataYear = item.year?.[0] ? parseInt(item.year[0], 10) : null;

      // Extract historical years from title/description
      const textToScan = `${title} ${desc}`;
      const yearMatches = Array.from(textToScan.matchAll(/\b(1[6-9]\d{2}|20[0-2]\d)\b/g))
        .map((m) => parseInt(m[1], 10))
        .filter((y) => y >= 1600 && y <= new Date().getFullYear());
      const historicalYears = yearMatches.filter((y) => y < 2000);

      // Prefer historical year from text over metadata year (which is often digitization date)
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

// ── K-samsök (SOCH) ─────────────────────────────────────────────
const KSAMSOK_API = "https://kulturarvsdata.se/ksamsok/api";

async function fetchKsamsok(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  try {
    // Run two queries: one broad ("KTH") and one for the full name, then merge
    const queries = [
      `text=KTH AND thumbnailExists=j`,
      `text="Kungliga Tekniska Högskolan" AND thumbnailExists=j`,
    ];
    if (searchQuery) {
      queries.length = 0;
      queries.push(`text=KTH AND text="${searchQuery}" AND thumbnailExists=j`);
      queries.push(`text="Kungliga Tekniska Högskolan" AND text="${searchQuery}" AND thumbnailExists=j`);
    }

    const fetches = queries.map(async (q) => {
      const url = `${KSAMSOK_API}?method=search&hitsPerPage=500&query=${encodeURIComponent(q)}&x-api=test`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const text = await res.text();
      return parseKsamsokXml(text);
    });

    const results = await Promise.all(fetches);
    // Deduplicate by id
    const seen = new Set<string>();
    const merged: UnifiedPhoto[] = [];
    for (const batch of results) {
      for (const photo of batch) {
        if (!seen.has(photo.id)) {
          seen.add(photo.id);
          merged.push(photo);
        }
      }
    }
    return merged;
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
      // If no historical year found, keep the modern metadata year (don't discard it)
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

// ── Deduplication helper ────────────────────────────────────────
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zåäö0-9]/g, "")
    .trim();
}

function deduplicatePhotos(photos: UnifiedPhoto[]): UnifiedPhoto[] {
  const seen = new Set<string>();
  return photos.filter((p) => {
    const keys: string[] = [];
    // Key 1: exact image URL (true duplicate)
    if (p.imageUrl) keys.push(`img:${p.imageUrl}`);
    // Key 2: cross-provider dedup for long titles with same year
    const norm = normalizeTitle(p.title);
    if (norm.length > 20) keys.push(`tv:${norm}|${p.year ?? "?"}`);

    if (keys.length === 0) return true;
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });
}

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

  const sources = isUndatedMode
    ? [fetchKsamsok(year, searchQuery), fetchDigitaltMuseum(year, searchQuery), fetchEuropeana(year, searchQuery)]
    : [fetchDigitaltMuseum(year, searchQuery), fetchEuropeana(year, searchQuery), fetchKsamsok(year, searchQuery)];

  for (const promise of sources) {
    promise.then((photos) => {
      let relevant = photos.filter(isKthRelevant);
      if (!searchQuery) {
        if (isUndatedMode) {
          relevant = relevant.filter((p) => p.year == null);
        } else {
          relevant = relevant.filter((p) => {
            if (p.yearCorrected) return true; // Year was corrected from text, keep it
            if (p.year == null) return false;
            return p.year >= from && p.year <= to;
          });
        }
      }
      accumulated.push(...relevant);
      onUpdate(deduplicatePhotos(accumulated).slice(0, 40));
    }).catch(() => {});
  }

  await Promise.allSettled(sources);
}
