import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fetchAllPhotosForSearch } from "@/data/fetchAllPhotosForSearch";
import type { UnifiedPhoto } from "@/data/types";
import { getHeaderPaperStyle } from "@/lib/paperColor";
import { SearchResultsList } from "./SearchResultsList";
import dymoSok from "@/assets/dymo-sok.png";
import dymoInfo from "@/assets/dymo-info.png";

interface SearchPaletteProps {
  onSelect: (photo: UnifiedPhoto, results: UnifiedPhoto[]) => void;
  year?: number;
  reopenSignal?: number;
  /** When true, render the trigger inputs/buttons in light (white) styling for dark backgrounds */
  light?: boolean;
}

function matchesQuery(photo: UnifiedPhoto, q: string): boolean {
  const haystack = [
    photo.title,
    photo.description,
    photo.photographer ?? "",
    photo.place,
    photo.source,
    photo.provider,
    photo.license,
    photo.coordinate ?? "",
    photo.originalLink,
    ...(photo.subjects ?? []),
    photo.year != null ? String(photo.year) : "odaterad",
  ]
    .join(" ")
    .toLowerCase();

  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function SearchPalette({ onSelect, year = 0, reopenSignal, light = false }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [allPhotos, setAllPhotos] = useState<UnifiedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const { color: headerPaperColor, spots: headerPaperSpots, edgeTint: headerEdgeTint } = getHeaderPaperStyle(year);

  // Reopen palette when parent signals (e.g. lightbox closed)
  useEffect(() => {
    if (reopenSignal && reopenSignal > 0) {
      setOpen(true);
    }
  }, [reopenSignal]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingPhotos(true);

    fetchAllPhotosForSearch().then((photos) => {
      if (!cancelled) {
        setAllPhotos(photos);
        setLoadingPhotos(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    if (!submitted.trim()) return [];
    return allPhotos.filter((photo) => matchesQuery(photo, submitted));
  }, [allPhotos, submitted]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSubmitted(query);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSubmitted(query);
    }
  };

  const handleSelect = (photo: UnifiedPhoto) => {
    onSelect(photo, filtered);
    setOpen(false);
    // keep query/submitted so the user can reopen and see the same results
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setQuery("");
      setSubmitted("");
    }
  };

  const paperDialogStyle = {
    ["--paper-color" as any]: headerPaperColor,
    ["--paper-spots" as any]: String(headerPaperSpots),
    ["--header-edge-tint" as any]: headerEdgeTint,
    borderColor: "rgba(26, 18, 8, 0.35)",
  };

  const inkTextStyle = { color: "#1a1208", fontFamily: "'Courier Prime', monospace" };
  const triggerStyle = inkTextStyle;

  // === Dymo label tape styling ===
  // Embossed dark plastic strip with raised white sans-serif caps. Used on the
  // archive cabinet header so the search/info controls feel like a real label
  // someone slapped onto the drawer.
  const dymoBase: React.CSSProperties = {
    // Slight vertical gradient mimics the convex curl of a plastic Dymo strip
    background:
      "linear-gradient(180deg, #1f1f1f 0%, #0a0a0a 45%, #161616 100%)",
    color: "#f5f5f5",
    fontFamily: "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.22em",
    // Embossed letter effect: bright top edge + dark bottom edge
    textShadow:
      "0 -1px 0 rgba(255,255,255,0.55), 0 1px 0 rgba(0,0,0,0.95), 0 0 1px rgba(255,255,255,0.25)",
    // Plastic strip: subtle outer rim + inner highlight along the top
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.6)",
    border: "none",
    borderRadius: 0,
  };
  const dymoButtonStyle: React.CSSProperties = { ...dymoBase };
  const dymoInputStyle: React.CSSProperties = {
    ...dymoBase,
    // input children should not inherit text-shadow on the caret
  };

  // Drop-shadow used for the dymo i-button in light mode
  const dymoShadow = "drop-shadow(0 2px 3px rgba(0,0,0,0.55)) drop-shadow(0 0 1px rgba(0,0,0,0.4))";

  // Flat dymo-tape style for the light "Sök" button — matches the i-button:
  // dark plastic strip with embossed white letters, no glossy highlight on top.
  const flatDymoStyle: React.CSSProperties = {
    background: "#0d0d0d",
    color: "#f5f5f5",
    fontFamily: "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textShadow: "0 1px 0 rgba(0,0,0,0.9)",
    boxShadow:
      "0 2px 3px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(0,0,0,0.7)",
    border: "none",
    borderRadius: 0,
  };

  return (
    <>
      {light ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Sök bland bilder (Ctrl+K)"
            className="inline-flex items-center justify-center px-3 text-xs sm:text-sm uppercase transition-transform hover:-translate-y-px active:translate-y-0 h-7 sm:h-9"
            style={flatDymoStyle}
          >
            Sök
          </button>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="Information om KTH i bilder"
            className="block transition-transform hover:-translate-y-px active:translate-y-0"
            style={{ filter: dymoShadow }}
          >
            <img src={dymoInfo} alt="" className="block h-7 w-7 sm:h-9 sm:w-9" draggable={false} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setOpen(true)}
              className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
              style={triggerStyle}
              aria-label="Sök bland bilder (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Sök</span>
            </button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="ink-border flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold transition-opacity hover:opacity-80"
              style={triggerStyle}
              aria-label="Information om KTH i bilder"
            >
              i
            </button>
          </div>

          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <label
              className="ink-border flex h-10 w-64 items-center gap-2 px-3 text-xs transition-colors lg:w-80"
              style={triggerStyle}
            >
              <Search className="h-4 w-4 shrink-0 opacity-80" />
              <input
                className="h-full min-w-0 flex-1 bg-transparent uppercase tracking-[0.12em] outline-none placeholder:text-black/35"
                style={triggerStyle}
                placeholder="Skriv sökord"
                value={query}
                onFocus={() => {
                  if (query.trim()) setOpen(true);
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                aria-label="Sök bland bilder"
              />
            </label>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="ink-border flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold transition-opacity hover:opacity-80"
              style={triggerStyle}
              aria-label="Information om KTH i bilder"
            >
              i
            </button>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="!fixed !inset-0 !left-0 !top-0 !z-50 !flex !items-start !justify-center !gap-0 !w-screen !max-w-none !translate-x-0 !translate-y-0 !border-0 !bg-transparent !p-0 !shadow-none [&>button]:hidden"
          aria-describedby="search-palette-description"
        >
          <DialogTitle className="sr-only">Sök bland bilder</DialogTitle>
          <DialogDescription id="search-palette-description" className="sr-only">
            Skriv ett sökord för att söka bland alla bilder i arkivet.
          </DialogDescription>

          <div
            className="paper-aged header-paper mt-[12vh] w-[min(48rem,calc(100vw-2rem))] overflow-hidden border shadow-lg max-sm:mt-0 max-sm:min-h-0 max-sm:max-h-[90vh] max-sm:w-full max-sm:border-0"
            style={paperDialogStyle}
          >
            <div className="relative" style={inkTextStyle}>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-100"
                style={{ color: "rgba(26, 18, 8, 0.75)" }}
                aria-label="Stäng sök"
              >
                <X className="h-5 w-5" />
              </button>

              <div
                className="relative z-10 flex items-center px-4 pr-12"
                style={{ borderBottom: "1px dashed rgba(26, 18, 8, 0.35)" }}
              >
                <Search className="mr-2 h-4 w-4 shrink-0" style={{ color: "rgba(26, 18, 8, 0.55)" }} />
                <input
                  className="flex h-16 w-full rounded-none bg-transparent py-3 text-sm uppercase tracking-[0.14em] outline-none placeholder:text-black/30"
                  style={{ color: "#1a1208", fontFamily: "'Courier Prime', monospace" }}
                  placeholder="Skriv sökord"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>

              <SearchResultsList
                loadingPhotos={loadingPhotos}
                submitted={submitted}
                filtered={filtered}
                onSelect={handleSelect}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent
          className="!fixed !inset-0 !left-0 !top-0 !z-50 !flex !items-start !justify-center !gap-0 !w-screen !max-w-none !translate-x-0 !translate-y-0 !border-0 !bg-transparent !p-0 !shadow-none [&>button]:hidden"
          aria-describedby="info-palette-description"
        >
          <DialogTitle className="sr-only">Information</DialogTitle>
          <DialogDescription id="info-palette-description" className="sr-only">
            Information om fler bildkällor och projektet KTH i bilder.
          </DialogDescription>

          <div
            className="paper-aged header-paper mt-[12vh] w-[min(32rem,calc(100vw-2rem))] overflow-hidden border shadow-lg max-sm:mt-0 max-sm:w-full max-sm:border-0"
            style={paperDialogStyle}
          >
            <div className="relative p-6 pr-12 text-sm leading-relaxed" style={inkTextStyle}>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-100"
                style={{ color: "rgba(26, 18, 8, 0.75)" }}
                aria-label="Stäng information"
              >
                <X className="h-5 w-5" />
              </button>

              <p className="mb-3 uppercase tracking-[0.08em]">Fler bilder finns bland annat hos:</p>
              <ul className="mb-6 space-y-2">
                <li>
                  <a
                    className="underline decoration-dashed underline-offset-4"
                    href="https://digitalt.kb.se/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    KB digitalt
                  </a>{" "}
                  <span className="opacity-75">(vykortssamling, sök: Kungliga Tekniska Högskolan)</span>
                </li>
                <li>
                  <a
                    className="underline decoration-dashed underline-offset-4"
                    href="https://flickr.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Flickr
                  </a>
                </li>
              </ul>

              <p className="text-xs leading-relaxed opacity-65">
                KTH i bilder är ett hobbyprojekt av{" "}
                <a
                  className="underline decoration-dashed underline-offset-4"
                  href="https://www.linkedin.com/in/sofieseo/"
                >
                  Sofie Seo
                </a>{" "}
                för att prova på vibekodning.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
