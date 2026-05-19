import { useState, useEffect } from "react";
import { Star, X, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FavoritePhoto {
  api_id: string;
  image_url: string | null;
  created_at: string;
}

interface AdminFavoritesModalProps {
  open: boolean;
  onClose: () => void;
  onToggleFavorite: (apiId: string, imageUrl?: string) => void;
  onOpenPhoto?: (photoId: string, imageUrl: string | null, title: string | null) => void;
}

export function AdminFavoritesModal({ open, onClose, onToggleFavorite, onOpenPhoto }: AdminFavoritesModalProps) {
  const [photos, setPhotos] = useState<FavoritePhoto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("admin_favorites")
      .select("api_id, image_url, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPhotos(data ?? []);
        setLoading(false);
      });
  }, [open]);

  const handleUnfavorite = (apiId: string, imageUrl: string | null) => {
    setPhotos((prev) => prev.filter((p) => p.api_id !== apiId));
    onToggleFavorite(apiId, imageUrl ?? undefined);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[80vh] mx-4 rounded-lg bg-stone-900 border border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Favoritmarkerade bilder</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-white/50 text-center py-8">Laddar…</p>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Star className="h-8 w-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">Inga favoriter ännu</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {photos.map((p) => {
                const photoUrl = `/?photo=${encodeURIComponent(p.api_id)}`;
                const handleOpen = (e: React.MouseEvent) => {
                  if (onOpenPhoto) {
                    e.preventDefault();
                    onOpenPhoto(p.api_id, p.image_url, null);
                  }
                };
                return (
                  <li key={p.api_id} className="flex items-center gap-3 rounded-md bg-white/5 px-3 py-2">
                    <a
                      href={photoUrl}
                      onClick={handleOpen}
                      target={onOpenPhoto ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="shrink-0 hover:opacity-80 transition-opacity"
                      title="Öppna bilden"
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="w-12 h-12 rounded-md object-cover bg-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center">
                          <ImageOff className="h-5 w-5 text-white/20" />
                        </div>
                      )}
                    </a>
                    <a
                      href={photoUrl}
                      onClick={handleOpen}
                      target={onOpenPhoto ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 hover:underline"
                      title="Öppna bilden"
                    >
                      <p className="text-xs text-white/80 truncate">{p.api_id}</p>
                    </a>
                    <button
                      onClick={() => handleUnfavorite(p.api_id, p.image_url)}
                      title="Ta bort favoritmarkering"
                      className="shrink-0 flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      Ta bort
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/30 text-center">{photos.length} favoriter</p>
        </div>
      </div>
    </div>
  );
}
