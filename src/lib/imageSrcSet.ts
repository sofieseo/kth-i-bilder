// Build a srcset string from a known image URL pattern.
// Returns null when the URL doesn't match a recognized pattern.
//
// Recognized patterns:
//   - DigitaltMuseum/Stadsmuseet: `...?dimension=NNNxNNN`
//   - Wikimedia Commons thumb:    `.../thumb/.../NNNpx-...`
export function buildThumbSrcSet(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  // DigitaltMuseum (ems.dimu.org) — `?dimension=400x400`
  const dimuMatch = url.match(/([?&])dimension=(\d+)x\2(?=&|$)/);
  if (dimuMatch) {
    const base = (n: number) => url.replace(/([?&])dimension=\d+x\d+/, `$1dimension=${n}x${n}`);
    return `${base(400)} 400w, ${base(800)} 800w, ${base(1200)} 1200w`;
  }

  // Wikimedia Commons thumb — `/NNNpx-filename`
  const wmcMatch = url.match(/\/(\d+)px-/);
  if (wmcMatch && /upload\.wikimedia\.org/.test(url)) {
    const swap = (n: number) => url.replace(/\/(\d+)px-/, `/${n}px-`);
    return `${swap(320)} 320w, ${swap(640)} 640w, ${swap(960)} 960w`;
  }

  return undefined;
}
