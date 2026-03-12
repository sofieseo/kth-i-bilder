import type { UnifiedPhoto } from "./types";

/**
 * Fetches images from specified Wikimedia Commons categories.
 * Uses the MediaWiki API to get file metadata (date, author, license, description).
 */

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

const KTH_CATEGORIES = [
  "Category:Royal_Institute_of_Technology",
  "Category:Kungliga_Tekniska_högskolans_bibliotek",
  "Category:Gamla_tekniska_högskolan,_Stockholm",
];

interface WikiImageInfo {
  title: string;
  pageid: number;
  imageinfo?: Array<{
    url: string;
    thumburl?: string;
    extmetadata?: Record<string, { value: string }>;
  }>;
}

function extractYear(meta: Record<string, { value: string }> | undefined): number | null {
  if (!meta) return null;

  // Try DateTimeOriginal first, then DateTime
  const dateStr = meta.DateTimeOriginal?.value || meta.DateTime?.value || "";
  const match = dateStr.match(/\b(1[6-9]\d{2}|20[0-2]\d)\b/);
  if (match) return parseInt(match[1], 10);

  // Try ObjectName or ImageDescription
  const desc = (meta.ObjectName?.value || "") + " " + (meta.ImageDescription?.value || "");
  const descMatch = desc.match(/\b(1[6-9]\d{2}|20[0-2]\d)\b/);
  if (descMatch) return parseInt(descMatch[1], 10);

  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

async function fetchCategoryMembers(category: string): Promise<string[]> {
  const titles: string[] = [];
  let cmcontinue: string | undefined;

  // Paginate to get all files
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: category,
      cmtype: "file",
      cmlimit: "50",
      format: "json",
      origin: "*",
    });
    if (cmcontinue) params.set("cmcontinue", cmcontinue);

    const res = await fetch(`${COMMONS_API}?${params}`);
    if (!res.ok) break;
    const data = await res.json();
    const members = data?.query?.categorymembers ?? [];
    titles.push(...members.map((m: any) => m.title as string));

    cmcontinue = data?.continue?.cmcontinue;
    if (!cmcontinue) break;
  }

  return titles;
}

async function fetchImageInfo(titles: string[]): Promise<WikiImageInfo[]> {
  const results: WikiImageInfo[] = [];

  // API accepts max ~50 titles per request
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "query",
      titles: batch.join("|"),
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "400",
      format: "json",
      origin: "*",
    });

    const res = await fetch(`${COMMONS_API}?${params}`);
    if (!res.ok) continue;
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    for (const page of Object.values(pages) as any[]) {
      if (page.imageinfo) {
        results.push(page as WikiImageInfo);
      }
    }
  }

  return results;
}

export async function fetchWikimediaCommons(year: number): Promise<UnifiedPhoto[]> {
  try {
    // Fetch all category members in parallel
    const allTitleArrays = await Promise.all(
      KTH_CATEGORIES.map(fetchCategoryMembers),
    );

    // Deduplicate titles across categories
    const uniqueTitles = [...new Set(allTitleArrays.flat())];

    // Fetch image info for all
    const imageInfos = await fetchImageInfo(uniqueTitles);

    const from = year;
    const to = year + 9;
    const isUndated = year === 0;

    const photos: UnifiedPhoto[] = [];

    for (const info of imageInfos) {
      const ii = info.imageinfo?.[0];
      if (!ii) continue;

      const meta = ii.extmetadata;
      const imgYear = extractYear(meta);

      // Filter by decade (unless undated mode)
      if (!isUndated) {
        if (imgYear == null || imgYear < from || imgYear > to) continue;
      } else {
        if (imgYear != null) continue;
      }

      const title = stripHtml(meta?.ObjectName?.value || info.title.replace("File:", "").replace(/\.\w+$/, ""));
      const desc = stripHtml(meta?.ImageDescription?.value || "");
      const author = stripHtml(meta?.Artist?.value || "");
      const license = meta?.LicenseShortName?.value || meta?.License?.value || "";

      // Use thumbnail URL if available, otherwise construct one
      const thumbUrl = ii.thumburl || ii.url;
      const fullUrl = ii.url;

      const commonsPage = `https://commons.wikimedia.org/wiki/${encodeURIComponent(info.title)}`;

      photos.push({
        id: `wmc-${info.pageid}`,
        title,
        source: "Wikimedia Commons",
        year: imgYear,
        imageUrl: thumbUrl,
        imageUrlFull: fullUrl,
        description: desc,
        coordinate: null,
        subjects: [],
        license,
        place: "",
        originalLink: commonsPage,
        provider: "Wikimedia Commons",
        photographer: author || undefined,
      });
    }

    return photos;
  } catch (e) {
    console.error("Wikimedia Commons fetch error:", e);
    return [];
  }
}
