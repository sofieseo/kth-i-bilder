import { useEffect, useRef } from "react";
import { getArchivePaperBeige } from "@/lib/paperColor";

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

  const beige = getArchivePaperBeige();

  return (
    <div
      ref={containerRef}
      className={`flex items-end overflow-x-auto md:overflow-x-visible overflow-y-visible no-scrollbar relative md:w-full ${compact ? "pt-1" : "pt-2"}`}
      style={{ scrollbarWidth: "none" }}
    >
      {DECADES.map((decade, idx) => {
        const isActive = decade === year;
        const tabColor = beige.color;
        return (
          <button
            key={decade}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onChange(decade)}
            aria-pressed={isActive}
            className={`relative shrink-0 md:shrink md:flex-1 md:min-w-0 transition-all ${
              isActive
                ? `${compact ? "h-9 px-3 text-xl" : "h-12 px-4 text-3xl"} font-bold`
                : `${compact ? "h-7 px-2.5 text-base" : "h-9 px-3 text-xl"} hover:-translate-y-0.5`
            } ${idx > 0 ? "-ml-2" : ""}`}
            style={{
              backgroundColor: tabColor,
              color: "#1a1208",
              // Realistic folder tab: only the top-right corner is rounded
              borderTopLeftRadius: "0",
              borderTopRightRadius: "12px 16px",
              // Only top + side borders, no bottom — tab dissolves into the page
              borderTop: "1px solid rgba(95, 65, 25, 0.38)",
              borderLeft: "1px solid rgba(95, 65, 25, 0.32)",
              borderRight: "1px solid rgba(95, 65, 25, 0.38)",
              borderBottom: "none",
              fontFamily: "'Caveat', cursive",
              opacity: 1,
              zIndex: isActive ? 50 : 10 + idx,
              // Keep bottom edge constant for ALL tabs — active only grows upward
              marginBottom: -12,
              paddingBottom: compact ? 16 : 18,
              // Only soft side/top shadow — no bottom shadow that would create a seam
              boxShadow: isActive
                ? "0 -2px 6px rgba(60, 40, 15, 0.18), -2px 0 5px rgba(60, 40, 15, 0.12), 2px 0 5px rgba(60, 40, 15, 0.10)"
                : "0 -1px 5px rgba(60, 40, 15, 0.14), -1px 0 4px rgba(60, 40, 15, 0.09)",
            }}
          >
            <span className="relative z-10">{labelFor(decade)}</span>
          </button>
        );
      })}
    </div>
  );
}