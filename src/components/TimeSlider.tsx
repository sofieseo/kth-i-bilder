import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const DECADES = [
  0,
  1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890,
  1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990,
  2000, 2010, 2020,
];

const MOBILE_BASE_LABELS = [
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

  // On mobile, inject the selected decade if it's not already in the base labels
  const visibleLabels = useMemo(() => {
    if (!isMobile) return DESKTOP_LABELS;
    const hasSelected = MOBILE_BASE_LABELS.some((l) => l.decade === year);
    if (hasSelected) return MOBILE_BASE_LABELS;
    const selectedLabel = { decade: year, text: year === 0 ? "ODATERAT" : `${year}` };
    return [...MOBILE_BASE_LABELS, selectedLabel].sort(
      (a, b) => DECADES.indexOf(a.decade) - DECADES.indexOf(b.decade)
    );
  }, [isMobile, year]);

  const decadeIndex = DECADES.indexOf(year) >= 0
    ? DECADES.indexOf(year)
    : DECADES.findIndex((d) => d >= year) || 0;

  return (
    <div className="w-full">
      <div className="mb-2">
        <span className="text-[11px] uppercase tracking-widest text-white/50 font-display font-semibold">
          Välj årtionde
        </span>
      </div>

      {/* Clickable labels above slider */}
      <div className="relative h-6 mb-2 mx-[9px]">
        {visibleLabels.map(({ decade, text }) => {
          const idx = DECADES.indexOf(decade);
          const pct = (idx / (DECADES.length - 1)) * 100;
          const isFirst = idx === 0;
          const isLast = pct === 100;
          const align = isFirst ? '-translate-x-[2px]' : isLast ? '-translate-x-full' : '-translate-x-1/2';
          const isActive = decade === year;
          return (
            <button
              key={decade}
              type="button"
              onClick={() => onChange(decade)}
              className={`absolute font-display font-semibold cursor-pointer hover:text-white transition-all duration-200 ${align} ${
                isActive
                  ? 'text-white text-[13px] sm:text-[15px] scale-110'
                  : 'text-white/60 hover:text-white/90 text-[9px] sm:text-[11px]'
              }`}
              style={{ left: isFirst ? '-9px' : `${pct}%` }}
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
