import { Loader2 } from "lucide-react";
import type { UnifiedPhoto } from "@/data/types";

interface SearchResultsListProps {
  loadingPhotos: boolean;
  submitted: string;
  filtered: UnifiedPhoto[];
  onSelect: (photo: UnifiedPhoto) => void;
}

export function SearchResultsList({ loadingPhotos, submitted, filtered, onSelect }: SearchResultsListProps) {
  return (
    <div className="relative z-10 max-h-[65vh] overflow-y-auto max-sm:max-h-[calc(90vh-4rem)]">
      {loadingPhotos && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "rgba(26, 18, 8, 0.6)" }} />
        </div>
      )}

      {!loadingPhotos && !submitted.trim() && <div className="py-5" />}

      {!loadingPhotos && submitted.trim() && filtered.length === 0 && (
        <p className="py-6 text-center text-sm uppercase tracking-wider" style={{ color: "rgba(26, 18, 8, 0.65)" }}>
          Inga träffar
        </p>
      )}

      {filtered.length > 0 && (
        <div>
          <p
            className="px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: "rgba(26, 18, 8, 0.6)", borderBottom: "1px dashed rgba(26, 18, 8, 0.25)" }}
          >
            {filtered.length} träffar
          </p>

          {filtered.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onSelect(photo)}
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
                  {[photo.year, photo.photographer, photo.place, photo.provider].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}