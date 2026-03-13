import { ImageOff, EyeOff } from "lucide-react";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";

function getPaperColor(year: number): string {
  if (year === 0 || year < 1900) return "#e8e0cc";
  if (year < 1990) return "#f4f1ea";
  return "#ffffff";
}

interface PhotoCardProps {
  photo: UnifiedPhoto;
  onClick: () => void;
  decade?: number;
  isAdmin?: boolean;
  onHide?: (id: string, imageUrl?: string) => void;
}

export function PhotoCard({ photo, onClick, decade = 2020, isAdmin, onHide }: PhotoCardProps) {
  const paperColor = getPaperColor(decade);

  return (
    <button
      onClick={onClick}
      className="relative w-full h-full text-left p-2 pb-6 shadow-[4px_6px_16px_rgba(0,0,0,0.45)] transition-colors duration-500 hover:shadow-[6px_10px_24px_rgba(0,0,0,0.55)] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
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
      <div className="mt-1.5 px-1">
        <h3 className="text-[10px] font-semibold leading-tight text-stone-800 line-clamp-2">
          {photo.title}
        </h3>
        {photo.description && (
          <p className="text-[9px] text-stone-500 line-clamp-3 mt-0.5">{photo.description}</p>
        )}
        {photo.place && (
          <p className="text-[8px] text-stone-400 line-clamp-1 mt-0.5">{photo.place}</p>
        )}
        <p className="text-[8px] text-stone-400 mt-0.5 line-clamp-2">{photo.source}</p>
      </div>
      <p className="absolute bottom-1.5 right-2 text-sm text-stone-600 whitespace-nowrap" style={{ fontFamily: "'Caveat', cursive" }}>
        {photo.year ?? "Odaterad"}
      </p>
      {isAdmin && onHide && (
        <button
          onClick={(e) => { e.stopPropagation(); onHide(photo.id, photo.imageUrl ?? undefined); }}
          className="absolute top-1 right-1 z-10 rounded-full bg-black/60 p-1 text-white hover:bg-red-600 transition-colors"
          title="Dölj denna bild"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      )}
    </button>
  );
}
