import { useState, useEffect } from "react";
import { X, Heart, Share2, Loader2, ImageOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhotoStat {
  photo_id: string;
  image_url: string | null;
  title: string | null;
  likes: number;
  shares: number;
}

interface AdminStatsModalProps {
  open: boolean;
  onClose: () => void;
}

/** Build a map of photo_id → {image_url, title} from curated_photos + photo_likes/shares image_url */
async function buildPhotoLookup(photoIds: string[]): Promise<Map<string, { image_url: string | null; title: string }>> {
  const map = new Map<string, { image_url: string | null; title: string }>();
  if (photoIds.length === 0) return map;

  // curated_photos – only fetch the IDs we need
  const { data: curated } = await supabase
    .from("curated_photos")
    .select("id, image_url, title")
    .in("id", photoIds);
  for (const row of curated ?? []) {
    map.set(row.id, { image_url: row.image_url, title: row.title });
  }

  // For IDs not found in curated, try hidden_api_photos for image_url
  const missing = photoIds.filter((id) => !map.has(id));
  if (missing.length > 0) {
    const { data: hidden } = await supabase
      .from("hidden_api_photos")
      .select("api_id, image_url")
      .in("api_id", missing);
    for (const row of hidden ?? []) {
      if (!map.has(row.api_id)) {
        map.set(row.api_id, { image_url: row.image_url, title: row.api_id });
      }
    }
  }

  return map;
}

export function AdminStatsModal({ open, onClose }: AdminStatsModalProps) {
  const [stats, setStats] = useState<PhotoStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    const [likesRes, sharesRes] = await Promise.all([
      supabase.from("photo_likes").select("photo_id, image_url"),
      supabase.from("photo_shares").select("photo_id, image_url"),
    ]);

    const likesMap = new Map<string, number>();
    const sharesMap = new Map<string, number>();
    const imageUrlMap = new Map<string, string | null>();

    for (const row of likesRes.data ?? []) {
      likesMap.set(row.photo_id, (likesMap.get(row.photo_id) ?? 0) + 1);
      if (row.image_url && !imageUrlMap.has(row.photo_id)) imageUrlMap.set(row.photo_id, row.image_url);
    }
    for (const row of (sharesRes.data as any[] ?? [])) {
      sharesMap.set(row.photo_id, (sharesMap.get(row.photo_id) ?? 0) + 1);
      if (row.image_url && !imageUrlMap.has(row.photo_id)) imageUrlMap.set(row.photo_id, row.image_url);
    }

    const allIds = [...new Set([...likesMap.keys(), ...sharesMap.keys()])];
    const lookup = await buildPhotoLookup(allIds);
    const combined: PhotoStat[] = allIds.map((id) => {
      const info = lookup.get(id);
      return {
        photo_id: id,
        image_url: info?.image_url ?? imageUrlMap.get(id) ?? null,
        title: info?.title ?? null,
        likes: likesMap.get(id) ?? 0,
        shares: sharesMap.get(id) ?? 0,
      };
    });

    combined.sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares));
    setStats(combined);
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDeleteLikes = async (photoId: string) => {
    setBusyId(photoId + ":likes");
    const { error } = await supabase.from("photo_likes").delete().eq("photo_id", photoId);
    setBusyId(null);
    if (error) {
      toast.error("Kunde inte ta bort gillningar");
      return;
    }
    toast.success("Gillningar borttagna");
    setStats((prev) => prev.flatMap((s) => {
      if (s.photo_id !== photoId) return [s];
      const next = { ...s, likes: 0 };
      return next.shares === 0 ? [] : [next];
    }));
  };

  const handleDeleteShares = async (photoId: string) => {
    setBusyId(photoId + ":shares");
    const { error } = await supabase.from("photo_shares").delete().eq("photo_id", photoId);
    setBusyId(null);
    if (error) {
      toast.error("Kunde inte ta bort delningar");
      return;
    }
    toast.success("Delningar borttagna");
    setStats((prev) => prev.flatMap((s) => {
      if (s.photo_id !== photoId) return [s];
      const next = { ...s, shares: 0 };
      return next.likes === 0 ? [] : [next];
    }));
  };

  const handleDeleteAll = async (photoId: string) => {
    if (!confirm("Ta bort alla gillningar och delningar för denna bild?")) return;
    setBusyId(photoId + ":all");
    const [likesRes, sharesRes] = await Promise.all([
      supabase.from("photo_likes").delete().eq("photo_id", photoId),
      supabase.from("photo_shares").delete().eq("photo_id", photoId),
    ]);
    setBusyId(null);
    if (likesRes.error || sharesRes.error) {
      toast.error("Kunde inte ta bort all data");
      return;
    }
    toast.success("Bilden borttagen från statistiken");
    setStats((prev) => prev.filter((s) => s.photo_id !== photoId));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[80vh] mx-4 rounded-lg bg-stone-900 border border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Engagemang</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
            </div>
          ) : stats.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-8">Inga interaktioner ännu</p>
          ) : (
            <ul className="space-y-2">
              {stats.map((s) => {
                const photoUrl = `/?photo=${encodeURIComponent(s.photo_id)}`;
                const isBusy = busyId?.startsWith(s.photo_id);
                return (
                  <li key={s.photo_id} className="flex items-center gap-3 rounded-md bg-white/5 px-3 py-2">
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 hover:opacity-80 transition-opacity"
                      title="Öppna bilden"
                    >
                      {s.image_url ? (
                        <img
                          src={s.image_url}
                          alt={s.title ?? ""}
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
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 hover:underline"
                      title="Öppna bilden"
                    >
                      <p className="text-xs text-white/80 truncate">{s.title ?? s.photo_id}</p>
                    </a>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.likes > 0 && (
                        <button
                          onClick={() => handleDeleteLikes(s.photo_id)}
                          disabled={isBusy}
                          title="Ta bort alla gillningar för denna bild"
                          className="group flex items-center gap-1 text-sm text-white/90 hover:text-red-300 disabled:opacity-40 transition-colors"
                        >
                          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 group-hover:hidden" />
                          <X className="h-3.5 w-3.5 hidden group-hover:block" />
                          {s.likes}
                        </button>
                      )}
                      {s.shares > 0 && (
                        <button
                          onClick={() => handleDeleteShares(s.photo_id)}
                          disabled={isBusy}
                          title="Ta bort alla delningar för denna bild"
                          className="group flex items-center gap-1 text-sm text-white/90 hover:text-red-300 disabled:opacity-40 transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5 group-hover:hidden" />
                          <X className="h-3.5 w-3.5 hidden group-hover:block" />
                          {s.shares}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAll(s.photo_id)}
                        disabled={isBusy}
                        title="Ta bort allt engagemang för denna bild"
                        className="text-white/40 hover:text-red-400 disabled:opacity-40 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/30 text-center">
            {stats.length} bilder med interaktioner · {stats.reduce((s, r) => s + r.likes, 0)} likes · {stats.reduce((s, r) => s + r.shares, 0)} delningar
          </p>
        </div>
      </div>
    </div>
  );
}
