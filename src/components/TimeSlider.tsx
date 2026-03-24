import { useIsMobile } from "@/hooks/use-mobile";

const DECADES = [
  0,
  1830, 1840, 1850, 1860, 1870, 1880, 1890,
  1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990,
  2000, 2010, 2020,
];

const MOBILE_LABELS = [
  { decade: 0, text: "ODATERAT" },
  { decade: 1850, text: "1850" },
  { decade: 1900, text: "1900" },
  { decade: 1950, text: "1950" },
  { decade: 2020, text: "2020" },
];

const DESKTOP_LABELS = DECADES.map((d) => ({
  decade: d,
  text: d === 0 ? "EJ DAT." : `${d}`,
}));

interface TimeSliderProps {
  year: number;
  onChange: (year: number) => void;
}

export function TimeSlider({ year, onChange }: TimeSliderProps) {
  const isMobile = useIsMobile();
  const visibleLabels = isMobile ? MOBILE_LABELS : DESKTOP_LABELS;
  const decadeIndex = DECADES.indexOf(year) >= 0
    ? DECADES.indexOf(year)
    : DECADES.findIndex((d) => d >= year) || 0;

  const label = year === 0 ? "ODATERAT" : `${year}-talet`;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-white/50 font-sans font-semibold">
          Välj årtionde
        </span>
        <span className="rounded-full border border-white/30 bg-white/15 backdrop-blur-sm px-3.5 py-1 text-[11px] font-extrabold text-white font-sans tracking-wide">
          {label}
        </span>
      </div>

      {/* Clickable labels above slider */}
      <div className="relative h-5 mb-2 mx-[9px]">
        {visibleLabels.map(({ decade, text }) => {
          const idx = DECADES.indexOf(decade);
          const pct = (idx / (DECADES.length - 1)) * 100;
          const isFirst = idx === 0;
          const isLast = pct === 100;
          const align = isFirst ? 'translate-x-0' : isLast ? '-translate-x-full' : '-translate-x-1/2';
          const isActive = decade === year;
          return (
            <button
              key={decade}
              type="button"
              onClick={() => onChange(decade)}
              className={`absolute text-[9px] sm:text-[11px] font-sans font-semibold cursor-pointer hover:text-white transition-colors ${align} ${isActive ? 'text-white' : 'text-white/60 hover:text-white/90'}`}
              style={{ left: `${pct}%` }}
            >
              {text}
            </button>
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
