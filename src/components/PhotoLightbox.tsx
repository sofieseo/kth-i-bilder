import { X, ExternalLink, Building2, MapPin, Calendar, Tag, ImageOff, Camera, Share2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";
import { supabase } from "@/integrations/supabase/client";

interface PhotoLightboxProps {
  photo: UnifiedPhoto;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function PhotoLightbox({ photo, onClose, onPrev, onNext, hasPrev, hasNext }: PhotoLightboxProps) {
  const [copied, setCopied] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const buildShareUrl = () => {
    const url = new URL("https://kth-i-bilder.lovable.app/");
    url.searchParams.set("photo", photo.id);
    const appYear = new URLSearchParams(window.location.search).get("year");
    if (appYear) url.searchParams.set("year", appYear);
    return url.toString();
  };

  const handleShare = () => {
    const shareUrl = buildShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    // Log share event
    supabase.from("photo_shares").insert({ photo_id: photo.id, image_url: photo.imageUrl ?? null }).then(() => {});
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev && hasPrev) { e.preventDefault(); onPrev(); }
      if (e.key === "ArrowRight" && onNext && hasNext) { e.preventDefault(); onNext(); }
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrev, onNext, hasPrev, hasNext, onClose]);

  // Lock body scroll while lightbox is open (prevents iOS Safari from
  // hijacking touch scroll for the underlying <main> scroller).
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Only trigger if horizontal swipe is dominant and > 50px
    if (absDx > 50 && absDx > absDy * 1.5) {
      if (dx > 0 && onPrev && hasPrev) onPrev();
      if (dx < 0 && onNext && hasNext) onNext();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-0 sm:p-4"
      style={{ height: "100dvh" }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      {/* Desktop prev/next arrows — positioned just outside the lightbox edges (max-w-2xl = 672px → 336px half-width) */}
      {onPrev && hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Föregående bild"
          className="hidden sm:block absolute left-1/2 -translate-x-[calc(336px+3rem)] z-20 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {onNext && hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Nästa bild"
          className="hidden sm:block absolute left-1/2 translate-x-[calc(336px+0.75rem)] z-20 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div
        className="relative z-10 w-full max-w-2xl sm:max-h-[90vh] max-sm:h-full overflow-y-auto overscroll-contain border-0 sm:border border-border shadow-2xl"
        style={{ backgroundColor: "#f4f1ea", WebkitOverflowScrolling: "touch" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          onClick={onClose}
          aria-label="Stäng"
          className="sticky top-3 float-right mr-3 z-20 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div style={{ backgroundColor: "#f4f1ea" }}>
          {photo.imageUrlFull ? (
            <img src={photo.imageUrlFull} alt={photo.title} className="w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="flex h-48 items-center justify-center">
              <ImageOff className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Mobile prev/next bar below image */}
        {(hasPrev || hasNext) && (
          <div className="flex sm:hidden items-center justify-between px-4 py-2 border-t border-border" style={{ backgroundColor: "#f4f1ea" }}>
            <button
              onClick={() => onPrev && hasPrev && onPrev()}
              disabled={!hasPrev}
              className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onNext && hasNext && onNext()}
              disabled={!hasNext}
              className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="p-5 space-y-3">
          <h2 className="text-xl font-bold text-card-foreground leading-tight uppercase">{photo.title}</h2>

          {photo.description && photo.description !== photo.title && <p className="text-sm text-muted-foreground">{photo.description}</p>}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-black shrink-0" />
              <span className="text-card-foreground">
                {photo.source && !photo.source.toLowerCase().includes(photo.provider.toLowerCase())
                  ? `${photo.provider} / ${photo.source}`
                  : photo.source || photo.provider}
              </span>
            </div>
            {photo.year && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-black shrink-0" />
                <span className="text-card-foreground">{photo.year}</span>
              </div>
            )}
            {photo.photographer && (
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-black shrink-0" />
                <span className="text-card-foreground">Foto: {photo.photographer}</span>
              </div>
            )}
            {photo.place && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-black shrink-0" />
                <span className="text-card-foreground">{photo.place}</span>
              </div>
            )}
            {photo.subjects.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {photo.subjects.map((s, i) => (
                    <span key={i} className="bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {photo.license && <p className="text-xs text-muted-foreground">Licens: {photo.license}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {photo.originalLink && (
              <a
                href={photo.originalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-foreground px-3 py-2 text-xs sm:text-sm font-semibold text-background hover:opacity-80 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Visa originalkälla</span>
                <span className="sm:hidden">Källa</span>
              </a>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-xs sm:text-sm font-semibold text-card-foreground hover:bg-muted transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Kopierad!" : <><span className="hidden sm:inline">Dela foto</span><span className="sm:hidden">Dela</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
