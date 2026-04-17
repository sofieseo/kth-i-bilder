import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchAllPhotosForSearch } from "@/data/fetchAllPhotosForSearch";
import type { UnifiedPhoto } from "@/data/types";
import { getPaperStyle } from "@/lib/paperColor";

interface SearchPaletteProps {
  onSelect: (photo: UnifiedPhoto) => void;
  year?: number;
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

export function SearchPalette({ onSelect, year = 0 }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [allPhotos, setAllPhotos] = useState<UnifiedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const { color: paperColor, spots: paperSpots } = getPaperStyle(year);

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

  // Load all photos when dialog opens
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
    return () => { cancelled = true; };
  }, [open]);

  const filtered = useMemo(() => {
    if (!submitted.trim()) return [];
    return allPhotos.filter((p) => matchesQuery(p, submitted));
  }, [allPhotos, submitted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSubmitted(query);
    }
  };

  const handleSelect = (photo: UnifiedPhoto) => {
    onSelect(photo);
    setOpen(false);
    setQuery("");
    setSubmitted("");
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setQuery("");
      setSubmitted("");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
        style={{ color: '#1a1208', fontFamily: "'Courier Prime', monospace" }}
        aria-label="Sök bland bilder (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sök</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="paper-aged overflow-hidden p-0 shadow-lg sm:max-w-3xl rounded-none border max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-full max-sm:border-0 flex flex-col gap-0"
          style={{
            ['--paper-color' as any]: paperColor,
            ['--paper-spots' as any]: String(paperSpots),
            borderColor: 'rgba(26, 18, 8, 0.35)',
            color: '#1a1208',
            fontFamily: "'Courier Prime', monospace",
          }}
        >
          <div className="relative z-10 flex items-center px-3" style={{ borderBottom: '1px dashed rgba(26, 18, 8, 0.35)' }}>
            <Search className="mr-2 h-4 w-4 shrink-0" style={{ color: 'rgba(26, 18, 8, 0.6)' }} />
            <input
              className="flex h-12 w-full rounded-none bg-transparent py-3 text-sm uppercase tracking-wider outline-none"
              style={{ color: '#1a1208', fontFamily: "'Courier Prime', monospace" }}
              placeholder="Skriv sökord"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="relative z-10 max-h-[500px] max-sm:max-h-[calc(100vh-60px)] overflow-y-auto">
            {loadingPhotos && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(26, 18, 8, 0.6)' }} />
              </div>
            )}
            {!loadingPhotos && !submitted.trim() && (
              <div className="py-6" />
            )}
            {!loadingPhotos && submitted.trim() && filtered.length === 0 && (
              <p className="py-6 text-center text-sm uppercase tracking-wider" style={{ color: 'rgba(26, 18, 8, 0.65)' }}>
                Inga träffar
              </p>
            )}
            {filtered.length > 0 && (
              <div className="p-0">
                <p className="px-3 py-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(26, 18, 8, 0.6)', borderBottom: '1px dashed rgba(26, 18, 8, 0.25)' }}>
                  {filtered.length} träffar
                </p>
                {filtered.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelect(photo)}
                    className="flex w-full items-center gap-3 rounded-none px-3 py-2 text-left transition-colors hover:bg-[rgba(26,18,8,0.06)]"
                    style={{ borderBottom: '1px dashed rgba(26, 18, 8, 0.2)' }}
                  >
                    {photo.imageUrl && (
                      <img
                        src={photo.imageUrl}
                        alt=""
                        className="h-10 w-10 sm:h-20 sm:w-20 shrink-0 rounded-none object-cover"
                        style={{ border: '1px solid rgba(26, 18, 8, 0.3)' }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: '#1a1208' }}>{photo.title}</p>
                      <p className="truncate text-xs mt-0.5" style={{ color: 'rgba(26, 18, 8, 0.65)' }}>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
