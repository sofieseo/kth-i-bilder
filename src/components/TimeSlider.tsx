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
    <div className="fixed bottom-10 left-1/2 z-[1000] w-[min(620px,94vw)] -translate-x-1/2 border border-white/20 bg-black/85 backdrop-blur-md px-5 py-2.5 shadow-2xl sm:px-6">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white font-sans font-bold">
          Välj årtionde
        </span>
        <span className="border border-white/40 bg-white px-2.5 py-px text-[10px] font-bold text-black font-sans tracking-wide">
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

      <div className="relative mt-1 h-5">
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
      <div className="mt-1 text-center">
        <span className="text-[9px] text-white/30 font-sans">Ett hobbyprojekt av Sofie Seo</span>
      </div>
    </div>
  );
}
