import { useState, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchAllPhotos } from "@/data/fetchAllPhotos";
import type { UnifiedPhoto } from "@/data/types";

interface SearchPaletteProps {
  onSelect: (photo: UnifiedPhoto) => void;
}

export function SearchPalette({ onSelect }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UnifiedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Cmd+K / Ctrl+K shortcut
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

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const results = await fetchAllPhotos(0, q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelect = (photo: UnifiedPhoto) => {
    onSelect(photo);
    setOpen(false);
    setQuery("");
    setSearchResults([]);
    setSearched(false);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setQuery("");
      setSearchResults([]);
      setSearched(false);
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
        <kbd className="hidden sm:inline-flex ml-1 h-4 items-center rounded border border-white/20 px-1 font-mono text-[10px] text-white/40">
          ⌘K
        </kbd>
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
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {!searched && !loading && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Skriv sökord och tryck Enter
              </p>
            )}
            {searched && !loading && searchResults.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Inga träffar
              </p>
            )}
            {searchResults.length > 0 && (
              <div className="p-1">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {searchResults.length} träffar
                </p>
                {searchResults.map((photo) => (
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
