export interface UnifiedPhoto {
  id: string;
  title: string;
  source: string;
  year: number | null;
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

function isKthRelevant(photo: UnifiedPhoto): boolean {
  const sourceLower = photo.source.toLowerCase();
  if (EXCLUDED_SOURCES.some((ex) => sourceLower.includes(ex))) return false;

  const searchable = [
    photo.title, photo.description, photo.place,
    ...photo.subjects,
  ].join(" ").toLowerCase();

  if (EXCLUDED_TERMS.some((term) => searchable.includes(term))) return false;
  if (EXCLUDED_OTHER_UNIVERSITIES.some((uni) => searchable.includes(uni))) return false;

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
  const from = year - 5;
  const to = year + 5;
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

async function fetchEuropeana(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  const from = year - 5;
  const to = year + 5;
  try {
    const typeFilter = encodeURIComponent("TYPE:IMAGE");
    const baseTerms = "KTH OR \"Kungliga Tekniska Högskolan\" OR \"Teknologiska institutet\" OR \"K.T.H.\"";
    const queryStr = searchQuery
      ? `(${baseTerms}) AND "${searchQuery}"`
      : baseTerms;
    const query = encodeURIComponent(queryStr);
    const qfParts = [`qf=${typeFilter}`, ...(searchQuery ? [] : [`qf=${encodeURIComponent(`YEAR:[${from} TO ${to}]`)}`])];
    const url = `${EUROPEANA_API}?wskey=${EUROPEANA_API_KEY}&query=${query}&${qfParts.join("&")}&rows=50&profile=standard`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items: any[] = data?.items ?? [];

    return items.map((item: any, i: number) => ({
      id: `euro-${item.id ?? i}`,
      title: (item.title ?? ["Utan titel"])[0],
      source: (item.dataProvider ?? ["Europeana"])[0],
      year: item.year?.[0] ? parseInt(item.year[0], 10) : null,
      imageUrl: item.edmPreview?.[0] ?? null,
      imageUrlFull: item.edmIsShownBy?.[0] ?? item.edmPreview?.[0] ?? null,
      description: (item.dcDescription ?? [""])[0],
      coordinate: null,
      subjects: item.dcSubject ?? [],
      license: item.rights?.[0] ?? "",
      place: "",
      originalLink: item.guid ?? "",
      provider: "Europeana" as const,
    }));
  } catch {
    return [];
  }
}

// ── K-samsök (SOCH) ─────────────────────────────────────────────
const KSAMSOK_API = "https://kulturarvsdata.se/ksamsok/api";

async function fetchKsamsok(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  try {
    const baseTerms = `text="KTH" OR text="Kungliga Tekniska Högskolan" OR text="Teknologiska institutet"`;
    const queryStr = searchQuery
      ? `(${baseTerms}) AND text="${searchQuery}" AND thumbnailExists=j`
      : `${baseTerms} AND thumbnailExists=j`;
    const query = encodeURIComponent(queryStr);
    const url = `${KSAMSOK_API}?method=search&hitsPerPage=100&query=${query}&x-api=test`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const records = xml.querySelectorAll("record");
    const results: UnifiedPhoto[] = [];

    // Helper: find element by local name (ignoring namespace prefixes)
    const getByLocal = (parent: Element, localName: string): Element | null => {
      const els = parent.getElementsByTagName("*");
      for (let j = 0; j < els.length; j++) {
        if (els[j].localName === localName) return els[j];
      }
      return null;
    };
    const getTextByLocal = (parent: Element, localName: string): string => {
      return getByLocal(parent, localName)?.textContent?.trim() ?? "";
    };

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

      // Try to extract year from context or timeLabel
      const fromTime = getTextByLocal(entity, "fromTime");
      let parsedYear = fromTime ? parseInt(fromTime.substring(0, 4), 10) : null;

      // Fallback: extract year from timeLabel in presentation (e.g. "1880 - 1880")
      if (!parsedYear) {
        const timeLabel = getTextByLocal(entity, "timeLabel");
        if (timeLabel) {
          const match = timeLabel.match(/(\d{4})/);
          if (match) parsedYear = parseInt(match[1], 10);
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
  } catch {
    return [];
  }
}

// ── Streaming fetch – calls onUpdate as each source resolves ────
export async function fetchAllPhotosStreaming(
  year: number,
  onUpdate: (photos: UnifiedPhoto[]) => void,
  searchQuery?: string,
): Promise<void> {
  const accumulated: UnifiedPhoto[] = [];

  const isUndatedMode = year === 0;
  const from = year - 5;
  const to = year + 5;

  const sources = isUndatedMode
    ? [fetchKsamsok(year, searchQuery), fetchDigitaltMuseum(year, searchQuery), fetchEuropeana(year, searchQuery)]
    : [fetchDigitaltMuseum(year, searchQuery), fetchEuropeana(year, searchQuery), fetchKsamsok(year, searchQuery)];

  for (const promise of sources) {
    promise.then((photos) => {
      let relevant = photos.filter(isKthRelevant);
      if (!searchQuery) {
        if (isUndatedMode) {
          // Only show photos without a year
          relevant = relevant.filter((p) => p.year == null);
        } else {
          // Filter by decade, exclude undated
          relevant = relevant.filter((p) => {
            if (p.year == null) return false;
            return p.year >= from && p.year <= to;
          });
        }
      }
      accumulated.push(...relevant);
      onUpdate(accumulated.slice(0, 40));
    }).catch(() => {});
  }

  await Promise.allSettled(sources);
}
