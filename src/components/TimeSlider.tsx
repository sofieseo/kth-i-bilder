import { useMemo, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const DECADES = [
  0,
  1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890,
  1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990,
  2000, 2010, 2020,
];

const MOBILE_BASE_LABELS = [
  { decade: 0, text: "ODAT." },
  { decade: 1850, text: "1850" },
  { decade: 1900, text: "1900" },
  { decade: 1950, text: "1950" },
  { decade: 2020, text: "2020" },
];

const DESKTOP_LABELS = DECADES.map((d) => ({
  decade: d,
  text: d === 0 ? "ODAT." : `${d}`,
}));

interface TimeSliderProps {
  year: number;
  onChange: (year: number) => void;
}

export function TimeSlider({ year, onChange }: TimeSliderProps) {
  const isMobile = useIsMobile();
  const [pickerOpen, setPickerOpen] = useState(false);

  const visibleLabels = useMemo(() => {
    if (!isMobile) return DESKTOP_LABELS;
    return MOBILE_BASE_LABELS;
  }, [isMobile]);

  const decadeIndex = DECADES.indexOf(year) >= 0
    ? DECADES.indexOf(year)
    : DECADES.findIndex((d) => d >= year) || 0;

  // Desktop: arrow keys change decade (disabled when a modal/lightbox or input has focus)
  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // Don't hijack arrows when typing in inputs or when a dialog is open
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      const delta = e.key === "ArrowLeft" ? -1 : 1;
      const next = Math.max(0, Math.min(DECADES.length - 1, decadeIndex + delta));
      if (next !== decadeIndex) onChange(DECADES[next]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, decadeIndex, onChange]);

  const label = year === 0 ? "ODATERAT" : `${year}-talet`;

  return (
    <div className="w-full relative z-10">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ fontFamily: "'Courier Prime', monospace", color: '#1a1208' }}>
          Välj årtionde
        </span>
        {isMobile && (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded-none border px-3 py-1 text-[11px] font-bold tracking-wide flex items-center gap-1.5 active:opacity-80"
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  color: '#1a1208',
                  borderColor: 'rgba(26, 18, 8, 0.45)',
                  background: 'rgba(26, 18, 8, 0.06)',
                }}
                aria-label="Välj årtionde"
              >
                {label}
                <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-44 p-1 rounded-none border shadow-lg"
              style={{
                background: '#f5efe0',
                borderColor: 'rgba(26, 18, 8, 0.45)',
                fontFamily: "'Courier Prime', monospace",
              }}
            >
              <div className="max-h-72 overflow-y-auto">
                {DECADES.map((d) => {
                  const text = d === 0 ? "ODATERAT" : `${d}-talet`;
                  const active = d === year;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        onChange(d);
                        setPickerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] tracking-wide transition-colors ${
                        active ? 'font-bold' : 'font-normal hover:bg-black/5'
                      }`}
                      style={{
                        color: '#1a1208',
                        background: active ? 'rgba(26, 18, 8, 0.12)' : 'transparent',
                      }}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
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
              style={{
                left: isFirst ? '-9px' : `${pct}%`,
                fontFamily: "'Courier Prime', monospace",
                color: isActive ? '#1a1208' : 'rgba(26, 18, 8, 0.45)',
              }}
              className={`absolute cursor-pointer transition-all duration-200 ${align} ${
                isActive
                  ? isMobile
                    ? 'text-[13px] font-bold'
                    : 'text-[15px] sm:text-[17px] font-bold scale-110'
                  : 'hover:opacity-90 text-[10px] sm:text-[11px] font-semibold'
              }`}
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
