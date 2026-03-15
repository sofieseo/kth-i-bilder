import { ImageOff, EyeOff, CalendarOff } from "lucide-react";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PhotoCardProps {
  photo: UnifiedPhoto;
  onClick: () => void;
  decade?: number;
  isAdmin?: boolean;
  onHide?: (id: string, imageUrl?: string) => void;
  onMarkUndated?: (id: string) => void;
}

export function PhotoCard({ photo, onClick, decade = 2020, isAdmin, onHide, onMarkUndated }: PhotoCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-full text-left bg-white rounded-md shadow-[3px_5px_14px_rgba(0,0,0,0.35)] hover:shadow-[5px_8px_20px_rgba(0,0,0,0.45)] hover:scale-[1.03] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
      style={{ padding: '6px 6px 28px 6px' }}
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-sm">
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
          className="absolute top-1 left-1 text-[7px] px-1 py-0.5 leading-tight rounded-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.85)', color: '#78716c' }}
        >
          {photo.provider}
        </span>
      </div>
      <div className="mt-2 px-1">
        <h3
          className="text-[11px] font-medium leading-snug text-stone-700 line-clamp-2"
          style={{ fontFamily: "'Caveat', cursive", fontSize: '14px' }}
        >
          {photo.title}
        </h3>
        {photo.place && (
          <p className="text-[8px] text-stone-400 line-clamp-1 mt-0.5">{photo.place}</p>
        )}
      </div>
      <p
        className="absolute bottom-1.5 right-2 text-stone-500 whitespace-nowrap"
        style={{ fontFamily: "'Caveat', cursive", fontSize: '13px' }}
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
}
