export interface DimuPhoto {
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
  dimuUrl: string;
}

const API_BASE = "https://api.dimu.org/api/solr/select";
const IMAGE_BASE = "https://mm.dimu.org/image";
const API_KEY = "demo";

export async function fetchDigitaltMuseum(year: number): Promise<DimuPhoto[]> {
  const fromYear = year - 5;
  const toYear = year + 5;

  // Use quoted phrase to get more precise KTH results
  const query = encodeURIComponent(
    "\"KTH\" OR \"Kungliga Tekniska Högskolan\" OR \"Tekniska Högskolan Stockholm\""
  );
  const fq = [
    `artifact.ingress.production.fromYear:[${fromYear} TO ${toYear}]`,
    "artifact.hasPictures:true",
  ]
    .map((f) => `fq=${encodeURIComponent(f)}`)
    .join("&");

  const url = `${API_BASE}?q=${query}&${fq}&wt=json&rows=40&api.key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`DigitaltMuseum API error: ${res.status}`);
  }

  const data = await res.json();
  const docs: any[] = data?.response?.docs ?? [];

  const kthKeywords = [
    "kth", "kungliga tekniska", "tekniska högskolan", "valhallavägen",
    "stockholm", "teknis", "östermalmsgatan",
  ];

  return docs
    .map((doc) => {
      const mediaId = doc["artifact.defaultMediaIdentifier"] ?? null;
      const uniqueId = doc["artifact.uniqueId"] ?? "";
      return {
        id: uniqueId || (doc["identifier.id"] ?? String(Math.random())),
        title: doc["artifact.ingress.title"] ?? "Utan titel",
        source: doc["identifier.owner"] ?? "Okänd källa",
        year: doc["artifact.ingress.production.fromYear"] ?? null,
        imageUrl: mediaId ? `${IMAGE_BASE}/${mediaId}?dimension=400x400` : null,
        imageUrlFull: mediaId ? `${IMAGE_BASE}/${mediaId}?dimension=1200x1200` : null,
        description:
          doc["artifact.ingress.classification"] ??
          doc["artifact.ingress.subjects"]?.[0] ??
          "",
        coordinate: doc["artifact.coordinate"] ?? null,
        subjects: doc["artifact.ingress.subjects"] ?? [],
        license: doc["artifact.ingress.license"] ?? "",
        place: doc["artifact.ingress.production.place"] ?? "",
        dimuUrl: uniqueId
          ? `https://digitaltmuseum.org/${uniqueId}`
          : "",
      };
    })
    .filter((photo) => {
      // Filter: title, description, place or source should mention KTH-related terms
      const searchable = [
        photo.title, photo.description, photo.place, photo.source,
        ...photo.subjects,
      ].join(" ").toLowerCase();
      return kthKeywords.some((kw) => searchable.includes(kw));
    })
    .slice(0, 20);
}
