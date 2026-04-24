import { useEffect, useRef } from "react";
import { getHeaderPaperStyle } from "@/lib/paperColor";

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

  return (
    <div
      ref={containerRef}
      className={`flex items-end overflow-x-auto md:overflow-x-visible overflow-y-visible no-scrollbar relative md:w-full ${compact ? "pt-1" : "pt-2"}`}
      style={{ scrollbarWidth: "none" }}
    >
      {DECADES.map((decade, idx) => {
        const isActive = decade === year;
        const tabColor = getHeaderPaperStyle(decade).color;
        return (
          <button
            key={decade}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onChange(decade)}
            aria-pressed={isActive}
            className={`relative shrink-0 md:shrink md:flex-1 md:min-w-0 font-mono tracking-widest transition-all ${
              isActive
                ? `${compact ? "h-8 px-3 text-[12px]" : "h-11 px-4 text-base"} font-bold`
                : `${compact ? "h-7 px-2.5 text-[10px]" : "h-9 px-3 text-xs"} hover:-translate-y-0.5`
            } ${idx > 0 ? "-ml-2" : ""}`}
            style={{
              backgroundColor: tabColor,
              color: "#1a1208",
              borderTop: "1px solid rgba(60, 40, 15, 0.55)",
              borderLeft: "1px solid rgba(60, 40, 15, 0.55)",
              borderRight: "1px solid rgba(60, 40, 15, 0.55)",
              borderBottom: "none",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              fontFamily: "'Courier Prime', monospace",
              opacity: isActive ? 1 : 0.82,
              zIndex: isActive ? 50 : 10 + idx,
              // Active tab "merges" into the page below by overlapping 1px
              marginBottom: isActive ? -1 : 0,
              boxShadow: isActive
                ? "inset 0 2px 4px rgba(255,255,255,0.35), -2px -2px 6px rgba(0,0,0,0.06)"
                : "inset 0 1px 2px rgba(255,255,255,0.2), -1px -1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {labelFor(decade)}
          </button>
        );
      })}
    </div>
  );
}
