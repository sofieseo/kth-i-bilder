import { useState, useEffect, useMemo } from "react";
import { Search, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAllPhotosForSearch } from "@/data/fetchAllPhotosForSearch";
import type { UnifiedPhoto } from "@/data/types";
import { getPaperStyle } from "@/lib/paperColor";

interface SearchPaletteProps {
  onSelect: (photo: UnifiedPhoto, results: UnifiedPhoto[]) => void;
  year?: number;
  reopenSignal?: number;
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

export function SearchPalette({ onSelect, year = 0, reopenSignal }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [allPhotos, setAllPhotos] = useState<UnifiedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const { color: paperColor, spots: paperSpots } = getPaperStyle(year);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSubmitted(query);
    }
  };

  const handleSelect = (photo: UnifiedPhoto) => {
    onSelect(photo, filtered);
    setOpen(false);
    setQuery("");
    setSubmitted("");
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setQuery("");
      setSubmitted("");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
        style={{ color: "#1a1208", fontFamily: "'Courier Prime', monospace" }}
        aria-label="Sök bland bilder (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sök</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="!fixed !inset-0 !left-0 !top-0 !z-50 !flex !items-start !justify-center !gap-0 !w-screen !max-w-none !translate-x-0 !translate-y-0 !border-0 !bg-transparent !p-0 !shadow-none [&>button]:hidden"
          aria-describedby="search-palette-description"
        >
          <DialogTitle className="sr-only">Sök bland bilder</DialogTitle>
          <DialogDescription id="search-palette-description" className="sr-only">
            Skriv ett sökord för att söka bland alla bilder i arkivet.
          </DialogDescription>

          <div className="paper-aged mt-[12vh] w-[min(48rem,calc(100vw-2rem))] overflow-hidden border shadow-lg max-sm:mt-0 max-sm:min-h-0 max-sm:max-h-[90vh] max-sm:w-full max-sm:border-0">
            <div
              className="relative"
              style={{
                ["--paper-color" as any]: paperColor,
                ["--paper-spots" as any]: String(paperSpots),
                borderColor: "rgba(26, 18, 8, 0.35)",
                color: "#1a1208",
                fontFamily: "'Courier Prime', monospace",
              }}
            >
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
                <Search
                  className="mr-2 h-4 w-4 shrink-0"
                  style={{ color: "rgba(26, 18, 8, 0.55)" }}
                />
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

              <div className="relative z-10 max-h-[65vh] overflow-y-auto max-sm:max-h-[calc(90vh-4rem)]">
                {loadingPhotos && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      style={{ color: "rgba(26, 18, 8, 0.6)" }}
                    />
                  </div>
                )}

                {!loadingPhotos && !submitted.trim() && <div className="py-5" />}

                {!loadingPhotos && submitted.trim() && filtered.length === 0 && (
                  <p
                    className="py-6 text-center text-sm uppercase tracking-wider"
                    style={{ color: "rgba(26, 18, 8, 0.65)" }}
                  >
                    Inga träffar
                  </p>
                )}

                {filtered.length > 0 && (
                  <div>
                    <p
                      className="px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
                      style={{
                        color: "rgba(26, 18, 8, 0.6)",
                        borderBottom: "1px dashed rgba(26, 18, 8, 0.25)",
                      }}
                    >
                      {filtered.length} träffar
                    </p>

                    {filtered.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => handleSelect(photo)}
                        className="flex w-full items-center gap-3 rounded-none px-4 py-2 text-left transition-colors hover:bg-black/5"
                        style={{ borderBottom: "1px dashed rgba(26, 18, 8, 0.2)" }}
                      >
                        {photo.imageUrl && (
                          <img
                            src={photo.imageUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-none object-cover sm:h-20 sm:w-20"
                            style={{ border: "1px solid rgba(26, 18, 8, 0.3)" }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" style={{ color: "#1a1208" }}>
                            {photo.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs" style={{ color: "rgba(26, 18, 8, 0.65)" }}>
                            {[photo.year, photo.photographer, photo.place, photo.provider]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
