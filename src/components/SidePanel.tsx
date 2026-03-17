import { useState } from "react";
import { X, Search, Loader2, ImageOff } from "lucide-react";
import { PhotoCard } from "./PhotoCard";
import { PhotoLightbox } from "./PhotoLightbox";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  results: UnifiedPhoto[];
  year: number;
  loading: boolean;
}

export function SidePanel({ open, onClose, results, year, loading }: SidePanelProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<UnifiedPhoto | null>(null);

  return (
    <>
      <div
        className={`fixed right-0 top-0 z-[1000] flex h-full w-80 flex-col panel-glass border-l border-border shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Foton · {year}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="mt-2 text-xs">Söker i flera arkiv…</span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ImageOff className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-center px-4">
                Inga foton hittades för detta årtal – prova att dra i tidslinjen!
              </p>
            </div>
          ) : (
            results.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
            ))
          )}
        </div>

        <div className="border-t border-border px-3 py-2">
          <p className="text-[10px] text-muted-foreground text-center">
            Data från Alvin, DigitaltMuseum, Stockholmskällan &amp; Europeana
          </p>
        </div>
      </div>

      {selectedPhoto && (
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </>
  );
}
