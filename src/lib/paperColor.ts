/**
 * Returns paper color and spot opacity based on the year/decade.
 * Used for polaroid frames and the header paper background.
 * 6 levels: oldest is most yellowed/spotted, newest is pure white.
 */
export function getPaperStyle(year: number | null | undefined): {
  color: string;
  spots: number;
} {
  // Undated bucket = oldest tier (but toned down from previous yellow)
  if (year == null || year === 0) return { color: "#ece5d2", spots: 0.7 };

  // Clamp to the timeline range
  const minYear = 1820;
  const maxYear = 2020;
  const y = Math.max(minYear, Math.min(maxYear, year));
  const t = (y - minYear) / (maxYear - minYear); // 0 = oldest, 1 = newest

  // Interpolate between an aged paper tone and pure white
  // Oldest: #ece5d2 (236, 229, 210) — softer than before
  // Newest: #ffffff (255, 255, 255)
  const r = Math.round(236 + (255 - 236) * t);
  const g = Math.round(229 + (255 - 229) * t);
  const b = Math.round(210 + (255 - 210) * t);
  const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // Spots fade from 0.7 (oldest) to 0.05 (newest)
  const spots = Math.round((0.7 - (0.7 - 0.05) * t) * 100) / 100;

  return { color, spots };
}
