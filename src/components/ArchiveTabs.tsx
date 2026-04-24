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
        // Per-tab subtle hue variation so no two folders look identical
        const hueShift = ((idx * 37) % 11) - 5; // -5..+5
        const lightShift = ((idx * 53) % 7) - 3; // -3..+3
        const tabColor = `hsl(${36 + hueShift} ${44 + lightShift}% ${72 + lightShift}%)`;
        return (
          <button
            key={decade}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onChange(decade)}
            aria-pressed={isActive}
            className={`relative shrink-0 md:shrink md:flex-1 md:min-w-0 font-mono tracking-widest transition-all ${
              isActive
                ? `${compact ? "h-9 px-3 text-[12px]" : "h-12 px-4 text-base"} font-bold`
                : `${compact ? "h-7 px-2.5 text-[10px]" : "h-9 px-3 text-xs"} hover:-translate-y-0.5`
            } ${idx > 0 ? "-ml-2" : ""}`}
            style={{
              backgroundColor: tabColor,
              color: "#1a1208",
              // Realistic folder tab: only the top-right corner is rounded
              borderTopLeftRadius: "0",
              borderTopRightRadius: "12px 16px",
              borderTop: "1px solid rgba(95, 65, 25, 0.42)",
              borderLeft: "1px solid rgba(95, 65, 25, 0.38)",
              borderRight: "1px solid rgba(95, 65, 25, 0.42)",
              borderBottom: "none",
              fontFamily: "'Courier Prime', monospace",
              opacity: isActive ? 1 : 0.95,
              zIndex: isActive ? 50 : 10 + idx,
              // Pull tabs down so they visually merge into the page background below
              marginBottom: isActive ? -6 : -4,
              paddingBottom: isActive ? (compact ? 10 : 14) : (compact ? 8 : 10),
              // No bright highlight on top — just gentle inner aging + outer shadow
              boxShadow: isActive
                ? "inset 0 -10px 14px -8px rgba(80, 50, 15, 0.28), inset 0 6px 10px -6px rgba(80, 50, 15, 0.18), 0 -2px 6px rgba(60, 40, 15, 0.22), -2px 0 5px rgba(60, 40, 15, 0.14), 2px 0 5px rgba(60, 40, 15, 0.10)"
                : "inset 0 -10px 14px -8px rgba(80, 50, 15, 0.24), inset 0 6px 10px -6px rgba(80, 50, 15, 0.16), 0 -1px 5px rgba(60, 40, 15, 0.16), -1px 0 4px rgba(60, 40, 15, 0.10)",
            }}
          >
            {/* Photorealistic paper texture: vertical fibers + foxing + soft patches */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  // Vertical paper fibers (very fine)
                  "repeating-linear-gradient(90deg, rgba(80, 55, 20, 0.045) 0 0.5px, transparent 0.5px 3px), " +
                  // Horizontal cross-fibers (subtler)
                  "repeating-linear-gradient(0deg, rgba(80, 55, 20, 0.025) 0 0.5px, transparent 0.5px 5px), " +
                  // Worn darker bottom edge (where folders touch the desk)
                  "linear-gradient(180deg, transparent 0%, transparent 60%, rgba(70, 45, 15, 0.10) 92%, rgba(70, 45, 15, 0.16) 100%), " +
                  // Worn left edge
                  "linear-gradient(90deg, rgba(70, 45, 15, 0.10) 0%, transparent 6%, transparent 94%, rgba(70, 45, 15, 0.10) 100%), " +
                  // Soft uneven patches
                  `radial-gradient(ellipse at ${20 + idx * 7 % 60}% 30%, rgba(110, 75, 25, 0.07), transparent 60%), ` +
                  `radial-gradient(ellipse at ${70 - idx * 5 % 50}% 70%, rgba(110, 75, 25, 0.06), transparent 60%)`,
                opacity: 1,
                mixBlendMode: "multiply",
                borderTopLeftRadius: "inherit",
                borderTopRightRadius: "inherit",
              }}
            />
            <span className="relative z-10">{labelFor(decade)}</span>
          </button>
        );
      })}
    </div>
  );
}