import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { UnifiedPhoto } from "@/data/types";

interface SearchPaletteProps {
  photos: UnifiedPhoto[];
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

export function SearchPalette({ photos, onSelect }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

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

  const filtered = useMemo(() => {
    if (!submitted.trim()) return [];
    return photos.filter((p) => matchesQuery(p, submitted));
  }, [photos, submitted]);

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
        <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-lg">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Sök på titel, fotograf, plats, ämne… (tryck Enter)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {!submitted.trim() && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Skriv sökord och tryck Enter
              </p>
            )}
            {submitted.trim() && filtered.length === 0 && (
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
