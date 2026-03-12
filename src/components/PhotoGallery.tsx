import { useState } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { PhotoCard } from "./PhotoCard";
import { PhotoLightbox } from "./PhotoLightbox";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";

interface PhotoGalleryProps {
  results: UnifiedPhoto[];
  year: number;
  loading: boolean;
}

export function PhotoGallery({ results, year, loading }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<UnifiedPhoto | null>(null);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        {loading && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mt-3 text-sm">Söker i arkiven…</span>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ImageOff className="h-10 w-10 text-white/30 mb-3" />
            <p className="text-base font-bold text-white text-center px-4">
              Inga foton hittades för detta årtionde
            </p>
            <p className="text-sm text-white/60 mt-1">Prova att dra i tidslinjen</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Söker i fler arkiv…</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {results.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} onClick={() => setSelectedPhoto(photo)} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/80 backdrop-blur-sm px-4 py-1.5">
        <p className="text-[10px] text-muted-foreground text-center">
          Data från DigitaltMuseum, Stockholmskällan, Wikimedia Commons, Europeana &amp; K-samsök
        </p>
      </div>

      {selectedPhoto && (
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </>
  );
}
