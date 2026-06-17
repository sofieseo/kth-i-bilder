import { useEffect, useLayoutEffect, useRef, useState } from "react";
import archiveFolderBg from "@/assets/archive-folder-bg.jpg";

const DECADES: number[] = [0, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

interface ArchiveTabsProps {
  year: number;
  onChange: (year: number) => void;
  compact?: boolean;
}

function labelFor(decade: number): string {
  return decade === 0 ? "ODAT." : String(decade);
}

type TabBackground = {
  x: number;
  y: number;
};

export function ArchiveTabs({ year, onChange, compact = false }: ArchiveTabsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [tabBackgrounds, setTabBackgrounds] = useState<Record<number, TabBackground>>({});
  const [bgSize, setBgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

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
        (document.activeElement as HTMLElement | null)?.blur?.();
        onChange(DECADES[idx - 1]);
      } else if (e.key === "ArrowRight" && idx < DECADES.length - 1) {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur?.();
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

  // Align every tab to the archive folder's own background image. This keeps the original
  // cut-from-the-folder look without using background-attachment: fixed, which is unstable on iOS.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const img = new Image();
    let naturalWidth = 1600;
    let naturalHeight = 1200;
    let frame = 0;

    const recalc = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const folder = document.querySelector<HTMLElement>("[data-archive-folder-bg]");
        if (!folder) return;

        const folderRect = folder.getBoundingClientRect();
        const scale = Math.max(folderRect.width / naturalWidth, folderRect.height / naturalHeight);
        const w = naturalWidth * scale;
        const h = naturalHeight * scale;
        const imageLeft = folderRect.left + (folderRect.width - w) / 2;
        const imageTop = folderRect.top + (folderRect.height - h) / 2;
        const next: Record<number, TabBackground> = {};

        tabRefs.current.forEach((el, decade) => {
          const rect = el.getBoundingClientRect();
          next[decade] = {
            x: imageLeft - rect.left,
            y: imageTop - rect.top,
          };
        });

        setBgSize({ w, h });
        setTabBackgrounds(next);
      });
    };

    const handleImageLoad = () => {
      naturalWidth = img.naturalWidth || naturalWidth;
      naturalHeight = img.naturalHeight || naturalHeight;
      recalc();
    };
    img.onload = handleImageLoad;
    img.src = archiveFolderBg;
    if (img.complete) handleImageLoad();

    const folder = document.querySelector<HTMLElement>("[data-archive-folder-bg]");
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(recalc) : null;
    if (folder) resizeObserver?.observe(folder);
    if (container) resizeObserver?.observe(container);

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    container?.addEventListener("scroll", recalc, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
      container?.removeEventListener("scroll", recalc);
    };
  }, [year, compact]);

  const tabColor = "#c4a373";

  return (
    <div
      ref={containerRef}
      className={`flex items-end overflow-x-auto md:overflow-x-visible overflow-y-hidden no-scrollbar relative md:w-full ${compact ? "pt-1" : "pt-2"}`}
      style={{ scrollbarWidth: "none", overscrollBehavior: "contain", touchAction: "pan-x" }}
    >
      {DECADES.map((decade, idx) => {
        const isActive = decade === year;
        const background = tabBackgrounds[decade];
        return (
          <button
            key={decade}
            ref={(el) => {
              if (el) tabRefs.current.set(decade, el);
              else tabRefs.current.delete(decade);
              if (isActive) activeRef.current = el;
            }}
            type="button"
            onClick={(e) => { e.currentTarget.blur(); onChange(decade); }}
            aria-pressed={isActive}
            className={`relative inline-flex h-16 shrink-0 items-start justify-center overflow-hidden leading-none md:shrink md:flex-1 md:min-w-0 transition-shadow duration-200 ease-out outline-none focus:outline-none focus-visible:outline-none ${
              isActive
                ? `${compact ? "h-10 px-2 pt-2 text-[20px]" : "h-16 px-2 pt-3 text-[26px]"} font-bold`
                : `${compact ? "h-8 px-2 pt-2 text-[17px]" : "h-[50px] px-2 pt-3 text-[21px]"}`
            } ${idx > 0 ? "-ml-2" : ""}`}
            style={{
              backgroundColor: tabColor,
              backgroundImage: `url(${archiveFolderBg})`,
              backgroundSize: bgSize.w > 0 ? `${bgSize.w}px ${bgSize.h}px` : "cover",
              backgroundPosition: background ? `${background.x}px ${background.y}px` : "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "scroll",
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
                ? "-2px -1px 4px rgba(0, 0, 0, 0.12), 2px -1px 4px rgba(0, 0, 0, 0.12)"
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
