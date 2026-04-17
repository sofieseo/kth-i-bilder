import { memo } from "react";
import { ImageOff, EyeOff, CalendarOff } from "lucide-react";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getPaperStyle } from "@/lib/paperColor";

interface PhotoCardProps {
  photo: UnifiedPhoto;
  onClick: () => void;
  decade?: number;
  isAdmin?: boolean;
  onHide?: (id: string, imageUrl?: string) => void;
  onMarkUndated?: (id: string) => void;
}

export const PhotoCard = memo(function PhotoCard({ photo, onClick, decade = 2020, isAdmin, onHide, onMarkUndated }: PhotoCardProps) {
  const paperColor = getPaperStyle(decade).color;

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left p-2 pb-5 shadow-[8px_14px_36px_-4px_rgba(0,0,0,0.65),0_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[12px_20px_48px_-4px_rgba(0,0,0,0.75),0_6px_16px_rgba(0,0,0,0.45)] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary flex flex-col"
      style={{ backgroundColor: paperColor }}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {photo.imageUrl ? (
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`flex h-full w-full items-center justify-center absolute inset-0 ${photo.imageUrl ? "hidden" : ""}`}>
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <span
          className="absolute top-1 left-1 text-[7px] px-1 py-0.5 leading-tight"
          style={{ backgroundColor: `${paperColor}dd`, color: "#78716c" }}
        >
          {photo.provider}
        </span>
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 4px 1px rgba(0,0,0,0.3)" }} />
      </div>
      <div className="mt-1.5 px-1 h-[4.5rem] overflow-hidden">
        <h3 className="text-xs font-semibold leading-tight text-stone-800 line-clamp-2 uppercase">
          {photo.title}
        </h3>
        {photo.description && photo.description !== photo.title && (
          <p className="text-[9px] text-stone-500 line-clamp-1 mt-0.5">{photo.description}</p>
        )}
        <p className="text-[8px] text-stone-400 mt-0.5 line-clamp-1">{photo.source}</p>
      </div>
      <p
        className={`absolute right-2 whitespace-nowrap text-stone-600 ${photo.year == null ? "bottom-1.5 text-sm" : "bottom-1 text-base"}`}
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
    </button>
  );
});
