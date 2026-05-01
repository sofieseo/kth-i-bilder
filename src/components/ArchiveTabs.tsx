import { useEffect, useRef } from "react";

const DECADES: number[] = [0, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

interface ArchiveTabsProps {
  year: number;
  onChange: (year: number) => void;
  compact?: boolean;
}

function labelFor(decade: number): string {
  return decade === 0 ? "ODAT." : String(decade);
}

export function ArchiveTabs({ year, onChange, compact = false }: ArchiveTabsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const idx = DECADES.indexOf(year);
      if (idx === -1) return;
      if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        onChange(DECADES[idx - 1]);
      } else if (e.key === "ArrowRight" && idx < DECADES.length - 1) {
        e.preventDefault();
        onChange(DECADES[idx + 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [year, onChange]);

  // Auto-scroll active tab into view (only relevant on mobile)
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [year]);

  const tabColor = "#9AA8AB";

  return (
    <div
      ref={containerRef}
      className={`flex items-end overflow-x-auto md:overflow-x-visible overflow-y-visible no-scrollbar relative md:w-full ${compact ? "pt-1" : "pt-2"}`}
      style={{ scrollbarWidth: "none" }}
    >
      {DECADES.map((decade, idx) => {
        const isActive = decade === year;
        return (
          <button
            key={decade}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onChange(decade)}
            aria-pressed={isActive}
            className={`relative inline-flex shrink-0 items-start justify-center overflow-hidden leading-none md:shrink md:flex-1 md:min-w-0 transition-all ${
              isActive
                ? `${compact ? "h-[60px] px-2 pt-2 text-[18px]" : "h-[82px] px-2 pt-3 text-[22px]"} font-bold`
                : `${compact ? "h-10 px-2 pt-2 text-[15px]" : "h-16 px-2 pt-3 text-[18px]"} hover:-translate-y-0.5`
            } ${idx > 0 ? "-ml-2" : ""}`}
            style={{
              backgroundColor: "#9AA8AB",
              backgroundImage: `
                repeating-linear-gradient(90deg, rgba(60,75,75,0.07) 0 1px, transparent 1px 4px),
                repeating-linear-gradient(0deg, rgba(60,75,75,0.04) 0 1px, transparent 1px 4px)
              `,
              color: "#1a2422",
              borderTopLeftRadius: "0",
              borderTopRightRadius: "12px 16px",
              borderTop: "1px solid rgba(40, 55, 55, 0.45)",
              borderLeft: "1px solid rgba(40, 55, 55, 0.35)",
              borderRight: "1px solid rgba(40, 55, 55, 0.45)",
              borderBottom: "none",
              fontFamily: "'Caveat', cursive",
              opacity: 1,
              zIndex: isActive ? 60 : 10 + idx,
              marginBottom: isActive ? -4 : 0,
              paddingBottom: 0,
              boxShadow: isActive
                ? "-3px 0 8px rgba(0, 0, 0, 0.25), 3px 0 8px rgba(0, 0, 0, 0.22)"
                : "0 -2px 6px rgba(0, 0, 0, 0.28), -1px 0 4px rgba(0, 0, 0, 0.20), 1px 0 4px rgba(0, 0, 0, 0.18)",
            }}
          >
            <span className="relative z-10">{labelFor(decade)}</span>
          </button>
        );
      })}
    </div>
  );
}