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
  if (year == null || year === 0) return { color: "#ece5d2", spots: 0.55 };

  const minYear = 1820;
  const maxYear = 2020;
  const y = Math.max(minYear, Math.min(maxYear, year));
  const t = (y - minYear) / (maxYear - minYear); // 0 = oldest, 1 = newest

  // Interpolate between an aged paper tone and pure white
  const r = Math.round(236 + (255 - 236) * t);
  const g = Math.round(229 + (255 - 229) * t);
  const b = Math.round(210 + (255 - 210) * t);
  const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // Spots fade from ~0.55 (oldest) to 0.04 (newest) — subtle, won't disturb text
  const spots = Math.round((0.55 - (0.55 - 0.04) * t) * 100) / 100;

  return { color, spots };
}

/**
 * Header paper uses its own cool gray-blue archive-label tone so it still ages
 * with the timeline without matching the photo frames exactly.
 */
export function getHeaderPaperStyle(year: number | null | undefined): {
  color: string;
  spots: number;
  edgeTint: string;
} {
  const minYear = 1820;
  const maxYear = 2020;
  const y = year == null || year === 0 ? minYear : Math.max(minYear, Math.min(maxYear, year));
  const t = (y - minYear) / (maxYear - minYear);
  const aging = 1 - t;

  const hue = Math.round(210 + 8 * aging);
  const saturation = Math.round(10 + 8 * aging);
  const lightness = Math.round(97 - 9 * aging);
  const spotStrength = Math.round((0.18 + 0.24 * aging) * 100) / 100;

  return {
    color: `hsl(${hue} ${saturation}% ${lightness}%)`,
    spots: spotStrength,
    edgeTint: `hsl(210 18% ${Math.round(46 + 18 * t)}% / ${Math.round((0.12 + 0.13 * aging) * 100) / 100})`,
  };
}

/**
 * Returns a "page curl" config for select decades, or null.
 * Only two non-consecutive decades have a curl, in different corners.
 * Placed in bottom corners so it never overlaps the header text/title.
 */
export function getPageCurl(year: number | null | undefined): {
  corner: "bottom-left" | "bottom-right";
} | null {
  if (year == null) return null;
  if (year === 1860) return { corner: "bottom-left" };
  if (year === 1940) return { corner: "bottom-right" };
  return null;
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

  // 1) Large uneven yellow/brown patches (the "tea-stain" look) — soft & sparse
  const patchCount = 2 + Math.floor(rand() * 2); // 2–3
  for (let i = 0; i < patchCount; i++) {
    const x = Math.round(rand() * 100);
    const y2 = Math.round(rand() * 100);
    const w = 30 + Math.round(rand() * 40);
    const h = 22 + Math.round(rand() * 30);
    const alpha = (0.025 + rand() * 0.05) * (0.4 + aging * 0.8);
    layers.push(
      `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y2}%, rgba(150, 110, 55, ${alpha.toFixed(3)}), transparent 70%)`
    );
  }

  // 2) Medium stains — a few discrete, soft blotches
  const stainCount = 2 + Math.floor(rand() * 3); // 2–4
  for (let i = 0; i < stainCount; i++) {
    const x = Math.round(rand() * 100);
    const y2 = Math.round(rand() * 100);
    const w = 4 + Math.round(rand() * 8);
    const h = 3 + Math.round(rand() * 6);
    const alpha = (0.05 + rand() * 0.08) * (0.4 + aging * 0.85);
    layers.push(
      `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y2}%, rgba(90, 60, 25, ${alpha.toFixed(3)}), transparent 75%)`
    );
  }

  // 3) Small dark specks ("foxing") — fewer and lighter
  const speckCount = 4 + Math.floor(rand() * 5); // 4–8
  for (let i = 0; i < speckCount; i++) {
    const x = (rand() * 100).toFixed(1);
    const y2 = (rand() * 100).toFixed(1);
    const size = (0.4 + rand() * 0.7).toFixed(2);
    const alpha = (0.1 + rand() * 0.15) * (0.4 + aging * 0.85);
    layers.push(
      `radial-gradient(circle at ${x}% ${y2}%, rgba(60, 40, 15, ${alpha.toFixed(3)}) ${size}px, transparent ${(parseFloat(size) + 1.0).toFixed(2)}px)`
    );
  }

  // 4) Water/damp stains — large soft blooms with a slightly darker "tide-mark"
  //    edge. Only meaningful on older paper (aging > ~0.4).
  if (aging > 0.4) {
    const dampCount = 1 + Math.floor(rand() * 2); // 1–2
    for (let i = 0; i < dampCount; i++) {
      const x = Math.round(rand() * 100);
      const y2 = Math.round(rand() * 100);
      const w = 45 + Math.round(rand() * 35); // very large
      const h = 30 + Math.round(rand() * 30);
      const intensity = (aging - 0.4) / 0.6; // 0..1
      const innerAlpha = (0.04 + rand() * 0.04) * intensity;
      const ringAlpha = (0.08 + rand() * 0.06) * intensity;
      // Soft amber bloom
      layers.push(
        `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y2}%, rgba(160, 115, 60, ${innerAlpha.toFixed(3)}) 0%, rgba(140, 95, 45, ${(innerAlpha * 0.7).toFixed(3)}) 55%, rgba(110, 75, 35, ${ringAlpha.toFixed(3)}) 72%, transparent 78%)`
      );
    }
  }

  return layers.join(", ");
}
