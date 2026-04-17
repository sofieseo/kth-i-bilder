/**
 * Returns paper color and spot opacity based on the year/decade.
 * Used for polaroid frames and the header paper background.
 * 6 levels: oldest is most yellowed/spotted, newest is pure white.
 */
export function getPaperStyle(year: number | null | undefined): {
  color: string;
  spots: number;
} {
  // Undated bucket = oldest tier
  if (year == null || year === 0) return { color: "#e4dcc4", spots: 0.95 };
  if (year < 1860) return { color: "#e4dcc4", spots: 0.95 };
  if (year < 1900) return { color: "#ebe2c8", spots: 0.75 };
  if (year < 1930) return { color: "#f0e8d4", spots: 0.5 };
  if (year < 1960) return { color: "#f5efe0", spots: 0.3 };
  if (year < 1990) return { color: "#faf6ec", spots: 0.15 };
  return { color: "#ffffff", spots: 0.05 };
}
