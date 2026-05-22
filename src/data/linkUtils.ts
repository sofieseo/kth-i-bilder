import type { UnifiedPhoto } from "./types";

export function normalizeOriginalLink(link: string): string;
export function normalizeOriginalLink(link: null): null;
export function normalizeOriginalLink(link: undefined): undefined;
export function normalizeOriginalLink(link: string | null | undefined) {
  if (typeof link !== "string") return link;

  const alvinRecordMatch = link.match(/urn:nbn:se:alvin:portal:record-(\d+)/i);
  if (alvinRecordMatch) {
    return `https://www.alvin-portal.org/alvin/view.jsf?pid=alvin-record%3A${alvinRecordMatch[1]}`;
  }

  return link.replace(/^http:\/\/urn\.kb\.se\//i, "https://urn.kb.se/");
}

export function normalizePhotoLinks<T extends UnifiedPhoto>(photos: T[]): T[] {
  return photos.map((photo) => ({
    ...photo,
    originalLink: normalizeOriginalLink(photo.originalLink),
  }));
}