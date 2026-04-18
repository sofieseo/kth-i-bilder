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
  // Undated bucket = oldest tier
  if (year == null || year === 0) return { color: "#ece5d2", spots: 1.1 };

  const minYear = 1820;
  const maxYear = 2020;
  const y = Math.max(minYear, Math.min(maxYear, year));
  const t = (y - minYear) / (maxYear - minYear); // 0 = oldest, 1 = newest

  // Interpolate between an aged paper tone and pure white
  const r = Math.round(236 + (255 - 236) * t);
  const g = Math.round(229 + (255 - 229) * t);
  const b = Math.round(210 + (255 - 210) * t);
  const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // Spots fade from ~1.1 (oldest) to 0.05 (newest)
  const spots = Math.round((1.1 - (1.1 - 0.05) * t) * 100) / 100;

  return { color, spots };
}

/**
 * Builds a CSS `background-image` value with seeded, decade-unique
 * stains and uneven yellowing. Stronger and darker for older decades.
 */
export function getPaperBackgroundImage(year: number | null | undefined): string {
  const decade = year == null || year === 0 ? 0 : Math.floor(year / 10) * 10;
  const rand = mulberry32(decade + 1);

  // Aging factor: 1 = oldest, 0 = newest
  const minYear = 1820;
  const maxYear = 2020;
  let aging: number;
  if (year == null || year === 0) {
    aging = 1;
  } else {
    const y = Math.max(minYear, Math.min(maxYear, year));
    aging = 1 - (y - minYear) / (maxYear - minYear);
  }

  const layers: string[] = [];

  // 1) Large uneven yellow/brown patches (the "tea-stain" look)
  const patchCount = 3 + Math.floor(rand() * 3); // 3–5
  for (let i = 0; i < patchCount; i++) {
    const x = Math.round(rand() * 100);
    const y2 = Math.round(rand() * 100);
    const w = 25 + Math.round(rand() * 45); // %
    const h = 18 + Math.round(rand() * 35); // %
    // darker amber for older paper
    const alpha = (0.05 + rand() * 0.12) * (0.4 + aging * 0.9);
    layers.push(
      `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y2}%, rgba(150, 110, 55, ${alpha.toFixed(3)}), transparent 70%)`
    );
  }

  // 2) Medium stains (more discrete blotches)
  const stainCount = 4 + Math.floor(rand() * 4); // 4–7
  for (let i = 0; i < stainCount; i++) {
    const x = Math.round(rand() * 100);
    const y2 = Math.round(rand() * 100);
    const w = 4 + Math.round(rand() * 10); // px-ish via %
    const h = 3 + Math.round(rand() * 8);
    const alpha = (0.12 + rand() * 0.2) * (0.35 + aging * 0.95);
    layers.push(
      `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y2}%, rgba(90, 60, 25, ${alpha.toFixed(3)}), transparent 75%)`
    );
  }

  // 3) Small dark specks ("foxing")
  const speckCount = 8 + Math.floor(rand() * 10); // 8–17
  for (let i = 0; i < speckCount; i++) {
    const x = (rand() * 100).toFixed(1);
    const y2 = (rand() * 100).toFixed(1);
    const size = (0.5 + rand() * 0.9).toFixed(2);
    const alpha = (0.25 + rand() * 0.3) * (0.4 + aging * 0.9);
    layers.push(
      `radial-gradient(circle at ${x}% ${y2}%, rgba(60, 40, 15, ${alpha.toFixed(3)}) ${size}px, transparent ${(parseFloat(size) + 1.2).toFixed(2)}px)`
    );
  }

  return layers.join(", ");
}
