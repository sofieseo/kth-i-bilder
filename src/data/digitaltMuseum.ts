import type { UnifiedPhoto } from "./types";

const DIMU_API = "https://api.dimu.org/api/solr/select";
const DIMU_IMG = "https://mm.dimu.org/image";

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

export async function fetchDigitaltMuseum(year: number, searchQuery?: string): Promise<UnifiedPhoto[]> {
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
