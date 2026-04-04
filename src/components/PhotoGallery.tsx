import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, ImageOff } from "lucide-react";
import { PhotoCard } from "./PhotoCard";
import { PhotoLightbox } from "./PhotoLightbox";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";

interface PhotoGalleryProps {
  results: UnifiedPhoto[];
  year: number;
  loading: boolean;
  isAdmin?: boolean;
  onHidePhoto?: (id: string, imageUrl?: string) => void;
  onMarkUndated?: (id: string) => void;
}

export function PhotoGallery({ results, year, loading, isAdmin, onHidePhoto, onMarkUndated }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<UnifiedPhoto | null>(null);
  const deepLinkHandled = useRef(false);

  // Handle ?photo=ID deep link
  useEffect(() => {
    if (deepLinkHandled.current || results.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const photoId = params.get("photo");
    if (photoId) {
      const found = results.find((p) => p.id === photoId);
      if (found) {
        setSelectedPhoto(found);
        deepLinkHandled.current = true;
      }
    }
  }, [results]);

  // Update URL when lightbox opens/closes
  const handleSelectPhoto = useCallback((photo: UnifiedPhoto | null) => {
    setSelectedPhoto(photo);
    const url = new URL(window.location.href);
    if (photo) {
      url.searchParams.set("photo", photo.id);
    } else {
      url.searchParams.delete("photo");
    }
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Memoize selected index to avoid repeated findIndex calls
  const selectedIndex = useMemo(() => {
    if (!selectedPhoto) return -1;
    return results.findIndex((p) => p.id === selectedPhoto.id);
  }, [selectedPhoto, results]);

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < results.length - 1;

  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) handleSelectPhoto(results[selectedIndex - 1]);
  }, [selectedIndex, results, handleSelectPhoto]);

  const handleNext = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < results.length - 1) handleSelectPhoto(results[selectedIndex + 1]);
  }, [selectedIndex, results, handleSelectPhoto]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        {loading && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Search className="h-10 w-10 text-white animate-search-tilt mb-3" />
            <span className="text-sm font-medium text-white">Söker i arkiven</span>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <ImageOff className="h-10 w-10 text-white/30 mb-3" />
            <p className="text-base font-bold text-white text-center px-4">Inga foton hittades för detta årtionde</p>
            <p className="text-sm text-white/60 mt-1">Prova att dra i tidslinjen</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="flex items-center gap-2 mb-3 text-xs text-stone-400">
                <Search className="h-3 w-3 animate-search-tilt text-white" />
                <span>Söker i fler arkiv…</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-start">
              {results.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  decade={year}
                  onClick={() => handleSelectPhoto(photo)}
                  isAdmin={isAdmin}
                  onHide={onHidePhoto}
                  onMarkUndated={onMarkUndated}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/80 backdrop-blur-sm px-4 py-1.5">
        <p className="text-[8px] text-muted-foreground text-center">
          Data från Alvin, Digitala Stadsmuseet, DigitaltMuseum, Europeana, K-samsök, Stockholmskällan &amp; Wikimedia
          Commons. Ett hobbyprojekt av Sofie Seo.
        </p>
      </div>

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => handleSelectPhoto(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </>
  );
}
