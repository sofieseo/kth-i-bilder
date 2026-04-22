import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { Search, ImageOff } from "lucide-react";
import { PhotoCard } from "./PhotoCard";
import { PhotoLightbox } from "./PhotoLightbox";
import { useIsMobile } from "@/hooks/use-mobile";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";

interface PhotoGalleryProps {
  results: UnifiedPhoto[];
  year: number;
  loading: boolean;
  isAdmin?: boolean;
  onHidePhoto?: (id: string, imageUrl?: string) => void;
  onMarkUndated?: (id: string) => void;
  openPhoto?: UnifiedPhoto | null;
  openPhotoNavSet?: UnifiedPhoto[] | null;
  onPhotoOpened?: () => void;
  onLightboxClosed?: (wasFromSearch: boolean) => void;
  onSwipeDecade?: (direction: "prev" | "next") => void;
  onScroll?: (scrollTop: number) => void;
  scrollToTopSignal?: number;
}

export function PhotoGallery({ results, year, loading, isAdmin, onHidePhoto, onMarkUndated, openPhoto, openPhotoNavSet, onPhotoOpened, onLightboxClosed, onSwipeDecade, onScroll, scrollToTopSignal }: PhotoGalleryProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll to top when signal changes
  useEffect(() => {
    if (scrollToTopSignal === undefined) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [scrollToTopSignal]);

  // Reset scroll on decade change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [year]);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeHandled = useRef(false);
  const horizontalLocked = useRef(false);
  const [swipeDx, setSwipeDx] = useState(0);
  // Crossfade transition between decades
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "out" | "in">("idle");
  const prevYearRef = useRef(year);

  // Trigger page-turn entrance when year changes
  useLayoutEffect(() => {
    if (prevYearRef.current === year) return;
    prevYearRef.current = year;
    setTransitionPhase("in");
    const t1 = window.setTimeout(() => setTransitionPhase("idle"), 280);
    return () => {
      clearTimeout(t1);
    };
  }, [year]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !onSwipeDecade) return;
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeHandled.current = false;
    horizontalLocked.current = false;
    setSwipeDx(0);
  }, [isMobile, onSwipeDecade]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !onSwipeDecade || swipeHandled.current) return;
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Lock to horizontal once intent is clear (avoid hijacking vertical scroll)
    if (!horizontalLocked.current) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        horizontalLocked.current = true;
      } else if (Math.abs(dy) > 12) {
        // Vertical scroll wins — disable swipe for this gesture
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
    }

    if (horizontalLocked.current) {
      // Dampened follow with cap so the gallery softly follows the finger
      const capped = Math.max(-160, Math.min(160, dx * 0.55));
      setSwipeDx(capped);
      // Commit the decade change once threshold passed
      if (Math.abs(dx) > 70) {
        onSwipeDecade(dx < 0 ? "next" : "prev");
        swipeHandled.current = true;
        touchStartX.current = null;
        touchStartY.current = null;
        setSwipeDx(0);
      }
    }
  }, [isMobile, onSwipeDecade]);

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    horizontalLocked.current = false;
    setSwipeDx(0);
  }, []);

  const [selectedPhoto, setSelectedPhoto] = useState<UnifiedPhoto | null>(null);
  // When a photo is opened from search, navigate within those search results instead of `results`
  const [navSet, setNavSet] = useState<UnifiedPhoto[] | null>(null);
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

  // Handle search selection via openPhoto prop
  useEffect(() => {
    if (!openPhoto) return;
    setNavSet(openPhotoNavSet ?? null);
    handleSelectPhoto(openPhoto);
    onPhotoOpened?.();
  }, [openPhoto]);

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

  const handleClose = useCallback(() => {
    const wasFromSearch = navSet !== null;
    handleSelectPhoto(null);
    setNavSet(null);
    onLightboxClosed?.(wasFromSearch);
  }, [navSet, handleSelectPhoto, onLightboxClosed]);

  // Use search nav set if active, otherwise the gallery's results
  const navList = navSet ?? results;

  // Memoize selected index to avoid repeated findIndex calls
  const selectedIndex = useMemo(() => {
    if (!selectedPhoto) return -1;
    return navList.findIndex((p) => p.id === selectedPhoto.id);
  }, [selectedPhoto, navList]);

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < navList.length - 1;

  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) handleSelectPhoto(navList[selectedIndex - 1]);
  }, [selectedIndex, navList, handleSelectPhoto]);

  const handleNext = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < navList.length - 1) handleSelectPhoto(navList[selectedIndex + 1]);
  }, [selectedIndex, navList, handleSelectPhoto]);

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 pb-6 pt-2 sm:pt-4"
        onScroll={onScroll ? (e) => onScroll((e.target as HTMLDivElement).scrollTop) : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform:
              swipeDx !== 0
                ? `translateX(${swipeDx}px)`
                : transitionPhase === "out"
                ? "translateY(-4px)"
                : transitionPhase === "in"
                ? "translateY(2px)"
                : "translateY(0)",
            opacity:
              swipeDx !== 0
                ? Math.max(0.55, 1 - Math.abs(swipeDx) / 320)
                : transitionPhase === "in"
                ? 0.72
                : 1,
            transition:
              swipeDx !== 0
                ? "none"
                : "opacity 280ms ease-out, transform 280ms ease-out",
            willChange: "transform, opacity",
          }}
        >
          {loading && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Search className="h-10 w-10 animate-search-tilt mb-3" style={{ color: "#f4f1ea" }} />
              <span className="text-sm font-medium" style={{ color: "#f4f1ea" }}>Söker i arkiven</span>
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
                <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: "#f4f1ea" }}>
                  <Search className="h-3 w-3 animate-search-tilt" style={{ color: "#f4f1ea" }} />
                  <span>Söker i fler arkiv…</span>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 items-start">
                {results.map((photo) => (
                  <PhotoCard
                    key={`${year}-${photo.id}-${photo.imageUrl ?? "no-image"}`}
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
          {results.length > 0 && !loading && (
            <p
              className="mt-10 mb-2 px-4 text-center text-[10px] sm:text-xs leading-relaxed"
              style={{
                color: "rgba(244, 241, 234, 0.55)",
                fontFamily: "'Courier Prime', monospace",
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              }}
            >
              Data från Alvin, Digitala Stadsmuseet, DigitaltMuseum, Europeana, K-samsök, Stockholmskällan &amp; Wikimedia Commons. Ett hobbyprojekt av Sofie Seo.
            </p>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </>
  );
}
