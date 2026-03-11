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
      className="w-full text-left border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="relative h-36 bg-muted">
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
        <span className="absolute top-1.5 left-1.5 bg-background/90 text-[8px] text-muted-foreground px-1.5 py-0.5 leading-tight">
          {photo.provider}
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold leading-tight text-card-foreground line-clamp-2">
          {photo.title}
        </h3>
        {photo.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{photo.description}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {photo.source}
          </span>
          {photo.year && (
            <span className="ml-auto text-[10px] text-muted-foreground">{photo.year}</span>
          )}
        </div>
      </div>
    </button>
  );
}
