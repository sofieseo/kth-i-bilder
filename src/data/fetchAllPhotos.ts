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
  "kth", "kungliga tekniska", "tekniska högskolan", "valhallavägen",
  "teknis", "östermalmsgatan",
];

const EXCLUDED_SOURCES = [
  "museum of far eastern antiquities",
  "östasiatiska museet",
];

function isKthRelevant(photo: UnifiedPhoto): boolean {
  const sourceLower = photo.source.toLowerCase();
  if (EXCLUDED_SOURCES.some((ex) => sourceLower.includes(ex))) return false;

  const searchable = [
    photo.title, photo.description, photo.place, photo.source,
    ...photo.subjects,
  ].join(" ").toLowerCase();
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

async function fetchDigitaltMuseum(year: number): Promise<UnifiedPhoto[]> {
  const from = year - 5;
  const to = year + 5;
  const query = encodeURIComponent(
    "\"KTH\" OR \"Kungliga Tekniska Högskolan\" OR \"Tekniska Högskolan Stockholm\""
  );
  const fq = [
    `artifact.ingress.production.fromYear:[${from} TO ${to}]`,
    "artifact.hasPictures:true",
  ].map((f) => `fq=${encodeURIComponent(f)}`).join("&");

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

async function fetchEuropeana(year: number): Promise<UnifiedPhoto[]> {
  const from = year - 5;
  const to = year + 5;
  try {
    // Encode brackets to avoid URL parsing issues
    const yearRange = encodeURIComponent(`YEAR:[${from} TO ${to}]`);
    const typeFilter = encodeURIComponent("TYPE:IMAGE");
    const query = encodeURIComponent("KTH OR \"Kungliga Tekniska Högskolan\"");
    const url = `${EUROPEANA_API}?wskey=${EUROPEANA_API_KEY}&query=${query}&qf=${yearRange}&qf=${typeFilter}&rows=50&profile=standard`;
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

async function fetchKsamsok(year: number): Promise<UnifiedPhoto[]> {
  try {
    const query = encodeURIComponent(
      `text="KTH" OR text="Kungliga Tekniska Högskolan" AND itemType=foto`
    );
    const url = `${KSAMSOK_API}?method=search&hitsPerPage=30&query=${query}&x-api=test`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const records = xml.querySelectorAll("record");
    const results: UnifiedPhoto[] = [];

    records.forEach((record, i) => {
      const entity = record.querySelector("entity");
      if (!entity) return;

      const getTag = (tag: string) => {
        const el = entity.querySelector(tag);
        return el?.textContent?.trim() ?? "";
      };

      const thumbnail = getTag("thumbnail");
      const lowres = entity.querySelector("lowressource")?.textContent?.trim() ?? "";
      const highres = entity.querySelector("highressource")?.textContent?.trim() ?? "";
      const title = getTag("itemlabel");
      const org = getTag("serviceorganizationfull") || getTag("collection");
      const desc = entity.querySelector("itemdescription desc")?.textContent?.trim() ?? "";
      const link = getTag("url");

      if (!thumbnail && !lowres) return;

      results.push({
        id: `soch-${entity.getAttribute("rdf:about") ?? i}`,
        title: title || "Utan titel",
        source: org || "K-samsök",
        year: null,
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
): Promise<void> {
  const accumulated: UnifiedPhoto[] = [];

  const sources = [
    fetchDigitaltMuseum(year),
    fetchEuropeana(year),
    fetchKsamsok(year),
  ];

  for (const promise of sources) {
    promise.then((photos) => {
      const relevant = photos.filter(isKthRelevant);
      accumulated.push(...relevant);
      onUpdate(accumulated.slice(0, 40));
    }).catch(() => {});
  }

  await Promise.allSettled(sources);
}
