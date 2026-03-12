import { ImageOff, Building2 } from "lucide-react";

import type { UnifiedPhoto } from "@/data/fetchAllPhotos";


interface PhotoCardProps {
  photo: UnifiedPhoto;
  onClick: () => void;
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative w-full h-full text-left bg-white p-2 pb-2 shadow-[4px_6px_16px_rgba(0,0,0,0.45)] transition-all hover:shadow-[6px_10px_24px_rgba(0,0,0,0.55)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary flex flex-col"
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
        <span className="absolute top-1 left-1 bg-white/85 text-[7px] text-neutral-500 px-1 py-0.5 leading-tight">
          {photo.provider}
        </span>
        {/* Polaroid inset shadow overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 4px 1px rgba(0,0,0,0.3)" }} />
      </div>
      <div className="mt-1.5 px-1">
        <h3 className="text-[10px] font-semibold leading-tight text-neutral-800 line-clamp-2">
          {photo.title}
        </h3>
        {photo.description && (
          <p className="text-[9px] text-neutral-500 line-clamp-3 mt-0.5">{photo.description}</p>
        )}
        {photo.place && (
          <p className="text-[8px] text-neutral-400 line-clamp-1 mt-0.5">{photo.place}</p>
        )}
        <p className="text-[8px] text-neutral-400 mt-0.5 line-clamp-2">{photo.source}</p>
      </div>
      <p className="absolute bottom-1.5 right-2 text-sm text-neutral-600 whitespace-nowrap" style={{ fontFamily: "'Caveat', cursive" }}>
        {photo.year ?? "Okänt år"}
      </p>
    </button>
  );
}
