/**
 * Returns paper styling based on the year/decade.
 * Used for polaroid frames and the header paper background.
 * 6 color levels + per-decade variant for creases/spots so each tier looks unique.
 */
export function getPaperStyle(year: number | null | undefined): {
  color: string;
  spots: number;
  spotImage?: string;
  creases?: string;
  creasesOpacity?: number;
} {
  const base = getBaseColor(year);
  const variant = getVariant(year);
  return { ...base, ...variant };
}

function getBaseColor(year: number | null | undefined): { color: string; spots: number } {
  if (year == null || year === 0) return { color: "#e4dcc4", spots: 0.95 };
  if (year < 1860) return { color: "#e4dcc4", spots: 0.95 };
  if (year < 1900) return { color: "#ebe2c8", spots: 0.75 };
  if (year < 1930) return { color: "#f0e8d4", spots: 0.5 };
  if (year < 1960) return { color: "#f5efe0", spots: 0.3 };
  if (year < 1990) return { color: "#faf6ec", spots: 0.15 };
  return { color: "#ffffff", spots: 0.05 };
}

/**
 * Variant per decade — adds unique fold lines, tears, or extra spots.
 * Older decades get more dramatic creases/tears; modern decades stay clean.
 */
function getVariant(year: number | null | undefined): {
  spotImage?: string;
  creases?: string;
  creasesOpacity?: number;
} {
  const decade = year == null || year === 0 ? 0 : Math.floor(year / 10) * 10;

  // Modern era — almost no creases
  if (decade >= 1990) return { creasesOpacity: 0 };

  // Pick variant by decade modulo so cycling through years gives variety
  const variantIndex = ((decade / 10) | 0) % 5;

  // Strength scales with age: oldest = strongest
  const strength =
    decade === 0 || decade < 1860 ? 1
      : decade < 1900 ? 0.85
      : decade < 1930 ? 0.65
      : decade < 1960 ? 0.45
      : 0.3;

  switch (variantIndex) {
    case 0:
      // Vertical fold down the middle + extra speckles
      return {
        creases: foldVerticalSvg(strength),
        creasesOpacity: 0.35 * strength,
        spotImage: extraSpots1(),
      };
    case 1:
      // Diagonal crease top-right to bottom-left + small tear in corner
      return {
        creases: foldDiagonalSvg(strength),
        creasesOpacity: 0.4 * strength,
        spotImage: extraSpots2(),
      };
    case 2:
      // Horizontal crease + cluster of brown spots
      return {
        creases: foldHorizontalSvg(strength),
        creasesOpacity: 0.3 * strength,
        spotImage: extraSpots3(),
      };
    case 3:
      // Edge tear on right side + light scratch
      return {
        creases: edgeTearSvg(strength),
        creasesOpacity: 0.45 * strength,
        spotImage: extraSpots1(),
      };
    case 4:
    default:
      // Subtle wavy crinkle texture
      return {
        creases: crinkleSvg(strength),
        creasesOpacity: 0.25 * strength,
        spotImage: extraSpots2(),
      };
  }
}

// ---------- SVG generators (returned as CSS url() data URIs) ----------

function svgUrl(inner: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>${inner}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function foldVerticalSvg(s: number): string {
  const a = 0.18 * s;
  return svgUrl(
    `<line x1='50' y1='0' x2='50' y2='100' stroke='rgba(60,40,15,${a})' stroke-width='0.3'/>` +
    `<line x1='50.4' y1='0' x2='50.4' y2='100' stroke='rgba(255,250,235,${a * 0.6})' stroke-width='0.2'/>`
  );
}

function foldDiagonalSvg(s: number): string {
  const a = 0.16 * s;
  return svgUrl(
    `<line x1='95' y1='5' x2='10' y2='90' stroke='rgba(60,40,15,${a})' stroke-width='0.35'/>` +
    `<line x1='95.3' y1='5.3' x2='10.3' y2='90.3' stroke='rgba(255,250,235,${a * 0.5})' stroke-width='0.2'/>` +
    `<path d='M 0 0 L 4 0 L 1.5 3 Z' fill='rgba(60,40,15,${0.2 * s})'/>`
  );
}

function foldHorizontalSvg(s: number): string {
  const a = 0.14 * s;
  return svgUrl(
    `<line x1='0' y1='62' x2='100' y2='62' stroke='rgba(60,40,15,${a})' stroke-width='0.3'/>` +
    `<line x1='0' y1='62.4' x2='100' y2='62.4' stroke='rgba(255,250,235,${a * 0.5})' stroke-width='0.2'/>`
  );
}

function edgeTearSvg(s: number): string {
  const a = 0.25 * s;
  return svgUrl(
    `<path d='M 100 30 L 96 32 L 99 35 L 95 38 L 100 41 Z' fill='rgba(60,40,15,${a})'/>` +
    `<path d='M 100 30 L 97 32 L 99.5 35 L 96 38 L 100 41 Z' fill='rgba(255,250,235,${a * 0.4})'/>` +
    `<line x1='30' y1='15' x2='65' y2='22' stroke='rgba(60,40,15,${0.1 * s})' stroke-width='0.2'/>`
  );
}

function crinkleSvg(s: number): string {
  const a = 0.1 * s;
  return svgUrl(
    `<path d='M 0 25 Q 25 22 50 26 T 100 24' fill='none' stroke='rgba(60,40,15,${a})' stroke-width='0.25'/>` +
    `<path d='M 0 55 Q 30 58 60 55 T 100 57' fill='none' stroke='rgba(60,40,15,${a})' stroke-width='0.25'/>` +
    `<path d='M 0 80 Q 20 78 45 81 T 100 79' fill='none' stroke='rgba(60,40,15,${a})' stroke-width='0.25'/>`
  );
}

// Spot variants — slightly different speckle distributions
function extraSpots1(): string {
  return [
    "radial-gradient(circle at 12% 60%, rgba(90, 70, 30, 0.16) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 70% 20%, rgba(90, 70, 30, 0.13) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 88% 65%, rgba(90, 70, 30, 0.11) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 35% 85%, rgba(90, 70, 30, 0.12) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 55% 50%, rgba(90, 70, 30, 0.09) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 22% 38%, rgba(90, 70, 30, 0.14) 0.5px, transparent 1.8px)",
  ].join(",");
}

function extraSpots2(): string {
  return [
    "radial-gradient(circle at 18% 25%, rgba(110, 75, 30, 0.18) 0.6px, transparent 2px)",
    "radial-gradient(circle at 78% 40%, rgba(90, 60, 25, 0.13) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 45% 70%, rgba(90, 70, 30, 0.10) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 92% 88%, rgba(110, 75, 30, 0.16) 0.6px, transparent 2px)",
    "radial-gradient(circle at 8% 78%, rgba(90, 70, 30, 0.11) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 60% 12%, rgba(90, 70, 30, 0.09) 0.5px, transparent 1.5px)",
  ].join(",");
}

function extraSpots3(): string {
  return [
    "radial-gradient(circle at 28% 32%, rgba(110, 75, 30, 0.20) 0.7px, transparent 2.2px)",
    "radial-gradient(circle at 32% 38%, rgba(110, 75, 30, 0.15) 0.5px, transparent 1.6px)",
    "radial-gradient(circle at 38% 30%, rgba(90, 60, 25, 0.13) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 75% 75%, rgba(90, 70, 30, 0.12) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 85% 30%, rgba(90, 70, 30, 0.10) 0.5px, transparent 1.5px)",
    "radial-gradient(circle at 15% 88%, rgba(90, 70, 30, 0.11) 0.5px, transparent 1.5px)",
  ].join(",");
}
