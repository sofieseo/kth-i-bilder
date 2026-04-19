import { useMemo, useEffect, useState, useRef } from "react";
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

  const goPrev = () => {
    const next = Math.max(0, decadeIndex - 1);
    if (next !== decadeIndex) onChange(DECADES[next]);
  };
  const goNext = () => {
    const next = Math.min(DECADES.length - 1, decadeIndex + 1);
    if (next !== decadeIndex) onChange(DECADES[next]);
  };

  // Mobile-only view: prominent decade selector with prev/next buttons
  if (isMobile) {
    const canPrev = decadeIndex > 0;
    const canNext = decadeIndex < DECADES.length - 1;
    return (
      <div className="w-full relative z-10">
        <div className="mb-1.5 text-center">
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-semibold"
            style={{ fontFamily: "'Courier Prime', monospace", color: 'rgba(26, 18, 8, 0.7)' }}
          >
            Välj årtionde
          </span>
        </div>
        <div className="flex items-stretch gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="Föregående årtionde"
            className="flex items-center justify-center px-2 border active:opacity-70 disabled:opacity-30"
            style={{
              color: '#1a1208',
              borderColor: 'rgba(26, 18, 8, 0.45)',
              background: 'rgba(26, 18, 8, 0.06)',
            }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex-1 border px-3 py-2.5 flex items-center justify-center gap-2 active:opacity-80 shadow-sm"
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  color: '#f5efe0',
                  borderColor: 'rgba(26, 18, 8, 0.55)',
                  background: '#5e6f54',
                }}
                aria-label="Välj årtionde"
              >
                <span className="text-base font-bold tracking-[0.15em]">{label}</span>
                <ChevronDown className="h-4 w-4" strokeWidth={2.5} style={{ color: '#f5efe0' }} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="center"
              sideOffset={6}
              className="w-56 p-1 rounded-none border shadow-lg"
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
                      className={`w-full text-left px-3 py-2 text-[13px] tracking-wide transition-colors ${
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
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            aria-label="Nästa årtionde"
            className="flex items-center justify-center px-2 border active:opacity-70 disabled:opacity-30"
            style={{
              color: '#1a1208',
              borderColor: 'rgba(26, 18, 8, 0.45)',
              background: 'rgba(26, 18, 8, 0.06)',
            }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  const ACCENT = '#5e6f54';
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.round(pct * (DECADES.length - 1));
    if (DECADES[idx] !== year) onChange(DECADES[idx]);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => setFromClientX(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, year]);


  return (
    <div className="w-full relative z-10">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ fontFamily: "'Courier Prime', monospace", color: '#1a1208' }}>
          Välj årtionde
        </span>
      </div>

      {/* Clickable labels above slider - aligned to thumb position */}
      <div className="relative h-6 mb-2">
        {visibleLabels.map(({ decade, text }) => {
          const idx = DECADES.indexOf(decade);
          const pct = (idx / (DECADES.length - 1)) * 100;
          const isFirst = idx === 0;
          const isLast = idx === DECADES.length - 1;
          const align = isFirst
            ? 'translate-x-0'
            : isLast
            ? '-translate-x-full'
            : '-translate-x-1/2';
          const isActive = decade === year;
          return (
            <button
              key={decade}
              type="button"
              onClick={() => onChange(decade)}
              style={{
                left: `${pct}%`,
                fontFamily: "'Courier Prime', monospace",
                color: isActive ? ACCENT : 'rgba(26, 18, 8, 0.45)',
              }}
              className={`absolute cursor-pointer transition-all duration-200 ${align} whitespace-nowrap ${
                isActive
                  ? 'text-[15px] sm:text-[17px] font-bold scale-110'
                  : 'hover:opacity-90 text-[10px] sm:text-[11px] font-semibold'
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>

      {/* Custom slider track with perfectly aligned thumb */}
      <div
        ref={trackRef}
        className={`relative w-full h-5 ${dragging ? 'cursor-grabbing' : 'cursor-pointer'} touch-none select-none`}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={DECADES.length - 1}
        aria-valuenow={decadeIndex}
        tabIndex={0}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          setDragging(true);
          setFromClientX(e.clientX);
        }}
      >
        {/* Track line */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{
            height: '1.5px',
            background: 'rgba(30, 20, 10, 0.85)',
          }}
        />
        {/* Thumb - positioned at exact same % as label */}
        <div
          className={`absolute top-1/2 pointer-events-none transition-transform ${dragging ? 'scale-110' : ''}`}
          style={{
            left: `${(decadeIndex / (DECADES.length - 1)) * 100}%`,
            transform: `translate(-50%, -50%) ${dragging ? 'scale(1.15)' : ''}`,
            width: '4px',
            height: '20px',
            background: ACCENT,
            boxShadow: '0 0 2px rgba(0, 0, 0, 0.4)',
          }}
        />
      </div>
    </div>
  );
}
