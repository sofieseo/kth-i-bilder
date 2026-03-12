import { X, ExternalLink, Building2, MapPin, Calendar, Tag, ImageOff, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";

interface PhotoLightboxProps {
  photo: UnifiedPhoto;
  onClose: () => void;
}

export function PhotoLightbox({ photo, onClose }: PhotoLightboxProps) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="sticky top-3 float-right mr-3 z-20 bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-muted">
          {photo.imageUrlFull ? (
            <img src={photo.imageUrlFull} alt={photo.title} className="w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="flex h-48 items-center justify-center">
              <ImageOff className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-card-foreground leading-tight">{photo.title}</h2>
            <span className="shrink-0 bg-black text-white text-[10px] font-semibold px-2 py-1">Källa: {photo.provider}</span>
          </div>

          {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-black shrink-0" />
              <span className="text-card-foreground">{photo.source}</span>
            </div>
            {photo.year && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-black shrink-0" />
                <span className="text-card-foreground">{photo.year}</span>
              </div>
            )}
            {photo.photographer && (
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary shrink-0" />
                <span className="text-card-foreground">Foto: {photo.photographer}</span>
              </div>
            )}
            {photo.place && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-card-foreground">{photo.place}</span>
              </div>
            )}
            {photo.subjects.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {photo.subjects.map((s, i) => (
                    <span key={i} className="bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {photo.license && <p className="text-xs text-muted-foreground">Licens: {photo.license}</p>}
          </div>

          {photo.originalLink && (
            <a href={photo.originalLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
              Visa originalkälla
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
