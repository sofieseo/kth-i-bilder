import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
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
    ...(photo.subjects ?? []),
    photo.year != null ? String(photo.year) : "",
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

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    return photos.filter((p) => matchesQuery(p, query)).slice(0, 20);
  }, [photos, query]);

  const handleSelect = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo) {
      onSelect(photo);
      setOpen(false);
      setQuery("");
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Sök på titel, fotograf, plats, ämne…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {query.trim() ? "Inga träffar" : "Börja skriva för att söka"}
          </CommandEmpty>
          {filtered.length > 0 && (
            <CommandGroup heading={`${filtered.length} träffar`}>
              {filtered.map((photo) => (
                <CommandItem
                  key={photo.id}
                  value={photo.id}
                  onSelect={handleSelect}
                  className="flex items-center gap-3 py-2"
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
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
