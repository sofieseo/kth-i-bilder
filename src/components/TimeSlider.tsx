const DECADES = [
  0,
  1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890,
  1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990,
  2000, 2010, 2020,
];

const VISIBLE_LABELS = [
  { decade: 0, text: "Odaterat" },
  { decade: 1850, text: "1850" },
  { decade: 1900, text: "1900" },
  { decade: 1950, text: "1950" },
  { decade: 2000, text: "2000" },
  { decade: 2020, text: "2020" },
];

interface TimeSliderProps {
  year: number;
  onChange: (year: number) => void;
}

export function TimeSlider({ year, onChange }: TimeSliderProps) {
  const decadeIndex = DECADES.indexOf(year) >= 0
    ? DECADES.indexOf(year)
    : DECADES.findIndex((d) => d >= year) || 0;

  const label = year === 0 ? "Odaterat" : `${year}-talet`;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white font-sans font-bold">
          Välj årtionde
        </span>
        <span className="rounded-full border border-white/25 bg-white/10 backdrop-blur-sm px-3 py-0.5 text-[10px] font-bold text-white font-sans tracking-wide">
          {label}
        </span>
      </div>

      {/* Labels above slider */}
      <div className="relative h-5 mb-1">
        {VISIBLE_LABELS.map(({ decade, text }) => {
          const idx = DECADES.indexOf(decade);
          const pct = (idx / (DECADES.length - 1)) * 100;
          return (
            <span
              key={decade}
              className={`absolute text-[9px] sm:text-[10px] text-white font-sans font-semibold ${idx === 0 ? 'translate-x-0' : '-translate-x-1/2'}`}
              style={{ left: `${pct}%` }}
            >
              {text}
            </span>
          );
        })}
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
    </div>
  );
}
