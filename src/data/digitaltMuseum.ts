import type { UnifiedPhoto } from "./types";

const DIMU_API = "https://api.dimu.org/api/solr/select";
const DIMU_IMG = "https://mm.dimu.org/image";
const ROWS_PER_PAGE = 200;

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

function buildUrl(queryStr: string, year: number, searchQuery?: string, start = 0): string {
  const isUndated = year === 0;
  const from = year;
  const to = year + 9;
  const fullQuery = searchQuery ? `(${queryStr}) AND "${searchQuery}"` : queryStr;
  const query = encodeURIComponent(fullQuery);

  const fqParts = [
    "artifact.hasPictures:true",
    ...(searchQuery || isUndated ? [] : [`artifact.ingress.production.fromYear:[${from} TO ${to}]`]),
    ...(isUndated ? ["-artifact.ingress.production.fromYear:[* TO *]"] : []),
  ];
  const fq = fqParts.map((f) => `fq=${encodeURIComponent(f)}`).join("&");

  return `${DIMU_API}?q=${query}&${fq}&wt=json&rows=${ROWS_PER_PAGE}&start=${start}&api.key=demo`;
}

function parseDocs(docs: any[]): UnifiedPhoto[] {
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
}

async function fetchPaginatedDocs(queryStr: string, year: number, searchQuery?: string): Promise<any[]> {
  const docs: any[] = [];
  let start = 0;
  let total: number | null = null;

  while (total === null || docs.length < total) {
    const res = await fetch(buildUrl(queryStr, year, searchQuery, start));
    if (!res.ok) break;

    const data = await res.json();
    const batch: any[] = data?.response?.docs ?? [];
    const numFound = data?.response?.numFound;

    if (typeof numFound === "number") total = numFound;
    if (batch.length === 0) break;

    docs.push(...batch);
    start += batch.length;

    if (batch.length < ROWS_PER_PAGE) break;
  }

  return docs;
}

export async function fetchDigitaltMuseum(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
  const kthTerms = "\"KTH\" OR \"Kungliga Tekniska Högskolan\" OR \"Tekniska Högskolan Stockholm\" OR \"K.T.H.\"";
  const tekInstTerms = "\"Teknologiska institutet\"";

  try {
    const [kthDocs, tekInstDocs] = await Promise.all([
      fetchPaginatedDocs(kthTerms, year, searchQuery),
      fetchPaginatedDocs(tekInstTerms, year, searchQuery),
    ]);

    const allDocs = [...kthDocs, ...tekInstDocs];
    const seen = new Set<string>();

    const uniqueDocs = allDocs.filter((doc) => {
      const key = doc["artifact.uniqueId"] ?? doc["artifact.uuid"] ?? null;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return parseDocs(uniqueDocs);
  } catch {
    return [];
  }
}
