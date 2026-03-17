import type { UnifiedPhoto } from "./types";

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

const STRICT_KTH_KEYWORDS = [
  "kth", "k.t.h.", "kungliga tekniska", "kungl. tekniska",
  "teknologiska institutet",
];

const STRICT_SOURCES: string[] = [];

export function isKthRelevant(photo: UnifiedPhoto): boolean {
  const sourceLower = photo.source.toLowerCase();
  if (EXCLUDED_SOURCES.some((ex) => sourceLower.includes(ex))) return false;

  const searchable = [
    photo.title, photo.description, photo.place,
    ...photo.subjects,
  ].join(" ").toLowerCase();

  if (EXCLUDED_TERMS.some((term) => searchable.includes(term))) return false;
  if (EXCLUDED_OTHER_UNIVERSITIES.some((uni) => searchable.includes(uni))) return false;

  if (STRICT_SOURCES.some((s) => sourceLower.includes(s))) {
    return STRICT_KTH_KEYWORDS.some((kw) => searchable.includes(kw));
  }

  return KTH_KEYWORDS.some((kw) => searchable.includes(kw));
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zåäö0-9]/g, "")
    .trim();
}

export function deduplicatePhotos(photos: UnifiedPhoto[]): UnifiedPhoto[] {
  const seen = new Set<string>();
  return photos.filter((p) => {
    const keys: string[] = [];
    if (p.imageUrl) keys.push(`img:${p.imageUrl}`);
    const norm = normalizeTitle(p.title);
    if (norm.length > 20) keys.push(`tv:${norm}|${p.year ?? "?"}`);

    if (keys.length === 0) return true;
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });
}
