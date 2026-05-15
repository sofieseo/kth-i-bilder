import { useEffect, useRef } from "react";
import tabBg from "@/assets/archive-folder-bg.jpg";

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

  const tabColor = "#c4a373";

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
            className={`relative inline-flex h-16 shrink-0 items-start justify-center overflow-hidden leading-none md:shrink md:flex-1 md:min-w-0 transition-shadow duration-200 ease-out ${
              isActive
                ? `${compact ? "h-10 px-2 pt-2 text-[18px]" : "h-16 px-2 pt-3 text-[22px]"} font-bold`
                : `${compact ? "h-8 px-2 pt-2 text-[15px]" : "h-[50px] px-2 pt-3 text-[18px]"}`
            } ${idx > 0 ? "-ml-2" : ""}`}
            style={{
              backgroundColor: "#bfa078",
              color: "#3a2a18",
              borderTopLeftRadius: "0",
              borderTopRightRadius: "12px 16px",
              borderTop: "1px solid rgba(80, 55, 25, 0.35)",
              borderLeft: "1px solid rgba(80, 55, 25, 0.25)",
              borderRight: "1px solid rgba(80, 55, 25, 0.35)",
              borderBottom: "none",
              fontFamily: "'Caveat', cursive",
              opacity: 1,
              zIndex: isActive ? 60 : 10,
              marginBottom: isActive ? -2 : 0,
              paddingBottom: isActive ? 2 : 0,
              boxShadow: isActive
                ? "-3px 0 8px rgba(0, 0, 0, 0.25), 3px 0 8px rgba(0, 0, 0, 0.22)"
                : "none",
            }}
          >
            <span className="relative z-10">{labelFor(decade)}</span>
          </button>
        );
      })}
    </div>
  );
}