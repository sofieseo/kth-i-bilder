import { useState, useEffect } from "react";
import { Eye, X, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HiddenPhoto {
  api_id: string;
  imageUrl?: string;
  title?: string;
}

interface HiddenPhotosModalProps {
  open: boolean;
  onClose: () => void;
  onRestore: (apiId: string) => void;
}

export function HiddenPhotosModal({ open, onClose, onRestore }: HiddenPhotosModalProps) {
  const [photos, setPhotos] = useState<HiddenPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("hidden_api_photos")
      .select("api_id")
      .then(({ data }) => {
        setPhotos(data?.map((r) => ({ api_id: r.api_id })) ?? []);
        setLoading(false);
      });
  }, [open]);

  const handleRestore = (apiId: string) => {
    setPhotos((prev) => prev.filter((p) => p.api_id !== apiId));
    onRestore(apiId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[80vh] mx-4 rounded-lg bg-stone-900 border border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Dolda API-bilder</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-white/50 text-center py-8">Laddar…</p>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageOff className="h-8 w-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">Inga dolda bilder</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {photos.map((p) => (
                <li key={p.api_id} className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-4 py-3">
                  <span className="text-xs text-white/80 font-mono truncate flex-1">{p.api_id}</span>
                  <button
                    onClick={() => handleRestore(p.api_id)}
                    className="shrink-0 flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Återställ
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/30 text-center">{photos.length} dolda bilder</p>
        </div>
      </div>
    </div>
  );
}
