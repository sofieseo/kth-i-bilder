import { memo } from "react";
import { ImageOff, EyeOff, CalendarOff, Heart, Star } from "lucide-react";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getPaperStyle } from "@/lib/paperColor";
import { usePhotoLikes } from "@/hooks/usePhotoLikes";
import { buildThumbSrcSet } from "@/lib/imageSrcSet";

interface PhotoCardProps {
  photo: UnifiedPhoto;
  onClick: () => void;
  decade?: number;
  isAdmin?: boolean;
  onHide?: (id: string, imageUrl?: string) => void;
  onMarkUndated?: (id: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, imageUrl?: string) => void;
}

// Deterministic, naturalistic rotation: ~65% straight, others lean ±0.3–0.8°
function getRotation(id: string): number {
  let h1 = 0;
  let h2 = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h1 = (h1 * 31 + id.charCodeAt(i)) | 0;
    h2 = Math.imul(h2 ^ id.charCodeAt(i), 16777619);
  }
  const a = Math.abs(h1);
  const b = Math.abs(h2);
  // ~65% chance of being perfectly straight (more natural, less busy)
  if (a % 100 < 65) return 0;
  // Use independent hash for direction so it's evenly split left/right
  const direction = b % 2 === 0 ? -1 : 1;
  // Magnitude between 0.3 and 0.8 degrees — very subtle
  const magnitude = 0.3 + ((a % 50) / 100);
  return Math.round(direction * magnitude * 10) / 10;
}

export const PhotoCard = memo(function PhotoCard({ photo, onClick, decade = 2020, isAdmin, onHide, onMarkUndated }: PhotoCardProps) {
  const paperColor = getPaperStyle(decade).color;
  const rotation = getRotation(photo.id);
  const { count, liked, toggleLike, loading } = usePhotoLikes(photo.id, photo.imageUrl);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="relative w-full text-left p-2 pb-8 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.14),0_4px_12px_-2px_rgba(0,0,0,0.07)] [transform:rotate(var(--photo-rotation))] hover:[transform:rotate(var(--photo-rotation))_translateY(-4px)_scale(1.02)] hover:shadow-[0_20px_44px_-6px_rgba(0,0,0,0.19),0_6px_16px_-3px_rgba(0,0,0,0.10)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary flex flex-col cursor-pointer"
      style={{ backgroundColor: paperColor, ['--photo-rotation' as any]: `${rotation}deg` }}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {photo.imageUrl ? (
          <img
            src={photo.imageUrl}
            srcSet={buildThumbSrcSet(photo.imageUrl)}
            sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
            alt={(typeof photo.description === "string" && photo.description.trim()) || photo.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`flex h-full w-full items-center justify-center absolute inset-0 ${photo.imageUrl ? "hidden" : ""}`}>
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 4px 1px rgba(0,0,0,0.3)" }} />
      </div>
      {(() => {
        const photographer = photo.photographer?.trim();
        const hasPhotographer = !!photographer && !/okänd|okand|unknown/i.test(photographer);
        return (
          <div className="mt-1.5 px-1 h-[4.5rem] overflow-hidden">
            <h3 className={`text-[13px] font-semibold leading-tight text-stone-800 uppercase ${hasPhotographer ? "line-clamp-2" : "line-clamp-3"}`}>
              {photo.title}
            </h3>
            {hasPhotographer && (
              <p className="text-[10px] text-stone-700 mt-0.5 line-clamp-1">
                Foto: {photographer}
              </p>
            )}
            <p className="text-[9px] font-semibold text-stone-600 mt-0.5 line-clamp-1">
              {photo.provider === photo.source ? photo.source : `${photo.provider}, ${photo.source}`}
            </p>
          </div>
        );
      })()}
      <button
        onClick={(e) => { e.stopPropagation(); if (!loading) toggleLike(); }}
        aria-label={liked ? "Ta bort gillamarkering" : "Gilla foto"}
        className="absolute bottom-3 left-2 z-10 inline-flex items-center gap-1 px-1 py-0.5 hover:bg-black/10 transition-colors"
      >
        <Heart
          className="h-3.5 w-3.5"
          style={{
            color: liked ? "#a44a3f" : "transparent",
            fill: liked ? "#a44a3f" : "transparent",
            stroke: liked ? "#a44a3f" : "#000",
            strokeWidth: 2.2,
          }}
        />
        {count > 0 && (
          <span className="text-[10px] font-semibold leading-none" style={{ color: liked ? "#a44a3f" : "#000" }}>
            {count}
          </span>
        )}
      </button>
      <p
        className={`absolute right-2 whitespace-nowrap text-stone-600 ${photo.year == null ? "bottom-3 text-sm" : "bottom-2.5 text-base"}`}
        style={{ fontFamily: "'Caveat', cursive" }}
      >
        {photo.year ?? "Odaterad"}
      </p>
      {isAdmin && (
        <div className="absolute top-1 right-1 z-10 flex gap-1">
          {onMarkUndated && photo.year != null && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkUndated(photo.id); }}
                    className="rounded-full bg-black/60 p-1 text-white hover:bg-amber-600 transition-colors"
                  >
                    <CalendarOff className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Markera som odaterad
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onHide && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); onHide(photo.id, photo.imageUrl ?? undefined); }}
                    className="rounded-full bg-black/60 p-1 text-white hover:bg-red-600 transition-colors"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Dölj denna bild
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
});
