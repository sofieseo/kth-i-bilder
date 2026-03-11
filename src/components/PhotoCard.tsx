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
      className="relative w-full text-left bg-white p-2 pb-8 shadow-md transition-all hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="relative aspect-square bg-muted">
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
      <div className="mt-1.5 px-1 space-y-0.5">
        <h3 className="text-[10px] font-semibold leading-tight text-neutral-800 line-clamp-2">
          {photo.title}
        </h3>
        {photo.description && (
          <p className="text-[9px] text-neutral-500 line-clamp-1">{photo.description}</p>
        )}
        {photo.year && (
          <p className="absolute bottom-1.5 right-2 text-sm text-neutral-600" style={{ fontFamily: "'Caveat', cursive" }}>{photo.year}</p>
        )}
        
        <p className="text-[8px] text-neutral-400">{photo.source}</p>
      </div>
    </button>
  );
}
