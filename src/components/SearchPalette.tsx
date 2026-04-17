import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchAllPhotosForSearch } from "@/data/fetchAllPhotosForSearch";
import type { UnifiedPhoto } from "@/data/types";

interface SearchPaletteProps {
  onSelect: (photo: UnifiedPhoto) => void;
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

export function SearchPalette({ onSelect }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [allPhotos, setAllPhotos] = useState<UnifiedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

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
        className="flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        aria-label="Sök bland bilder (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sök</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-3xl max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0 flex flex-col gap-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Skriv sökord"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="max-h-[300px] max-sm:max-h-[calc(100vh-60px)] overflow-y-auto">
            {loadingPhotos && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingPhotos && !submitted.trim() && (
              <div className="py-6" />
            )}
            {!loadingPhotos && submitted.trim() && filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Inga träffar
              </p>
            )}
            {filtered.length > 0 && (
              <div className="p-1">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {filtered.length} träffar
                </p>
                {filtered.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelect(photo)}
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {photo.imageUrl && (
                      <img
                        src={photo.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{photo.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
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
