const DECADES = [
  0,
  1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890,
  1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990,
  2000, 2010, 2020,
];

const VISIBLE_LABELS: Record<number, string> = {
  0: "Okänt",
  1850: "1850",
  1900: "1900",
  1950: "1950",
  2000: "2000",
  2020: "2020",
};

interface TimeSliderProps {
  year: number;
  onChange: (year: number) => void;
}

export function TimeSlider({ year, onChange }: TimeSliderProps) {
  const decadeIndex = DECADES.indexOf(year) >= 0
    ? DECADES.indexOf(year)
    : DECADES.findIndex((d) => d >= year) || 0;

  const label = year === 0 ? "Odaterade" : `${year}-talet`;

  // Positions of visible labels as percentages
  const labelEntries = Object.entries(VISIBLE_LABELS).map(([decade, text]) => {
    const idx = DECADES.indexOf(Number(decade));
    const pct = (idx / (DECADES.length - 1)) * 100;
    return { decade: Number(decade), text, pct };
  });

  return (
    <div className="fixed bottom-4 left-1/2 z-[1000] w-[min(620px,94vw)] -translate-x-1/2 border border-white/20 bg-black/85 backdrop-blur-md px-5 py-2.5 shadow-2xl sm:px-6">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-white font-sans font-bold">
          Välj årtionde
        </span>
        <span className="border border-white/40 bg-white px-2.5 py-px text-xs font-bold text-black font-sans tracking-wide">
          {label}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={DECADES.length - 1}
        step={1}
        value={decadeIndex}
        onChange={(e) => onChange(DECADES[Number(e.target.value)])}
        className="timeline-slider w-full cursor-pointer"
      />

      <div className="mt-1 flex justify-between">
        {labelEntries.map(({ decade, text, pct }) => (
          <span
            key={decade}
            className="text-[10px] sm:text-[11px] text-white/80 font-sans font-semibold whitespace-nowrap"
            style={{ position: "relative", left: `${pct - (labelEntries.indexOf(labelEntries.find(l => l.decade === decade)!) / (labelEntries.length - 1)) * 100}%` }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
