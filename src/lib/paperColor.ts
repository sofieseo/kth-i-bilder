/**
 * Returns paper color and spot styling based on the year/decade.
 * Used for polaroid frames and the header paper background.
 * Color and spot pattern vary continuously and per-decade so every
 * timeline step looks unique and a bit unevenly aged.
 */

// Tiny seeded PRNG (mulberry32) so each decade gets its own stable pattern
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getPaperStyle(year: number | null | undefined): {
  color: string;
  spots: number;
} {
  // Undated bucket = same paper tone as the oldest dated tier (1820)
  if (year == null || year === 0) return { color: "#f3f0e5", spots: 0.42 };

  const minYear = 1820;
  const maxYear = 2020;
  const y = Math.max(minYear, Math.min(maxYear, year));
  const t = (y - minYear) / (maxYear - minYear); // 0 = oldest, 1 = newest

  // Interpolate from a lighter aged paper tone to a soft present-day archival white
  const r = Math.round(243 + (253 - 243) * t);
  const g = Math.round(240 + (253 - 240) * t);
  const b = Math.round(229 + (250 - 229) * t);
  const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // Spots fade from older paper into the present while staying subtle
  const spots = Math.round((0.42 - (0.42 - 0.03) * t) * 100) / 100;

  return { color, spots };
}

/**
 * Header paper uses its own cool blue-gray archive-folder tone so it still ages
 * with the timeline without matching the photo frames exactly.
 */
export function getHeaderPaperStyle(year: number | null | undefined): {
  color: string;
  spots: number;
  edgeTint: string;
} {
  // Classic manila archive folder tone — warm cream/tan, slightly aged for older decades.
  const minYear = 1820;
  const maxYear = 2020;
  const y = year == null || year === 0 ? minYear : Math.max(minYear, Math.min(maxYear, year));
  const t = (y - minYear) / (maxYear - minYear);
  const aging = 1 - t;

  // Hue 36–40 = manilla/kraft tan. Saturation a bit higher for older folders.
  const hue = Math.round(38 - 2 * aging);
  const saturation = Math.round(34 + 8 * aging);
  // Lightness: newer folders are brighter cream, older are slightly darker tan.
  const lightness = Math.round(80 - 7 * aging);
  const spotStrength = Math.round((0.12 + 0.2 * aging) * 100) / 100;

  return {
    color: `hsl(${hue} ${saturation}% ${lightness}%)`,
    spots: spotStrength,
    edgeTint: `hsl(32 30% ${Math.round(46 + 10 * t)}% / ${Math.round((0.12 + 0.14 * aging) * 100) / 100})`,
  };
}

/**
 * Uniform warm manilla folder tone used for the page background and
 * for all archive folder tabs. Classic archive folder color.
 */
export function getArchivePaperBeige(): {
  color: string;
  edgeTint: string;
} {
  // Classic manilla folder tone — warm tan/kraft, lifted a touch lighter
  return {
    color: "#e3cba6",
    edgeTint: "hsl(34 32% 48% / 0.30)",
  };
}
