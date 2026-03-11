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
      className="w-full text-left bg-white p-2 pb-8 shadow-md transition-all hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
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
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-xs font-semibold leading-tight text-neutral-800 line-clamp-2">
          {photo.title}
        </h3>
        {photo.year && (
          <span className="text-[10px] text-neutral-500">{photo.year}</span>
        )}
      </div>
    </button>
  );
}
