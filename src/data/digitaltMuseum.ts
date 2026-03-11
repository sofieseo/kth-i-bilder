export interface DimuPhoto {
  id: string;
  title: string;
  source: string;
  year: number | null;
  imageUrl: string | null;
  description: string;
  coordinate: string | null;
}

const API_BASE = "https://api.dimu.org/api/solr/select";
const IMAGE_BASE = "https://mm.dimu.org/image";
const API_KEY = "demo";

export async function fetchDigitaltMuseum(year: number): Promise<DimuPhoto[]> {
  const fromYear = year - 5;
  const toYear = year + 5;

  const query = encodeURIComponent("KTH OR \"Kungliga Tekniska Högskolan\" OR \"Tekniska Högskolan\"");
  const fq = [
    `artifact.ingress.production.fromYear:[${fromYear} TO ${toYear}]`,
    "artifact.hasPictures:true",
  ]
    .map((f) => `fq=${encodeURIComponent(f)}`)
    .join("&");

  const url = `${API_BASE}?q=${query}&${fq}&wt=json&rows=20&api.key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`DigitaltMuseum API error: ${res.status}`);
  }

  const data = await res.json();
  const docs: any[] = data?.response?.docs ?? [];

  return docs.map((doc) => {
    const mediaId = doc["artifact.defaultMediaIdentifier"] ?? null;
    return {
      id: doc["artifact.uniqueId"] ?? doc["identifier.id"] ?? String(Math.random()),
      title: doc["artifact.ingress.title"] ?? "Utan titel",
      source: doc["identifier.owner"] ?? "Okänd källa",
      year: doc["artifact.ingress.production.fromYear"] ?? null,
      imageUrl: mediaId ? `${IMAGE_BASE}/${mediaId}?dimension=400x400` : null,
      description:
        doc["artifact.ingress.classification"] ??
        doc["artifact.ingress.subjects"]?.[0] ??
        "",
      coordinate: doc["artifact.coordinate"] ?? null,
    };
  });
}
