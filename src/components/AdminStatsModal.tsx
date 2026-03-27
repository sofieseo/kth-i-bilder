import { useState, useEffect } from "react";
import { X, Heart, Share2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PhotoStat {
  photo_id: string;
  likes: number;
  shares: number;
}

interface AdminStatsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminStatsModal({ open, onClose }: AdminStatsModalProps) {
  const [stats, setStats] = useState<PhotoStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([
      supabase.from("photo_likes").select("photo_id"),
      supabase.from("photo_shares").select("photo_id"),
    ]).then(([likesRes, sharesRes]) => {
      const likesMap = new Map<string, number>();
      const sharesMap = new Map<string, number>();

      for (const row of likesRes.data ?? []) {
        likesMap.set(row.photo_id, (likesMap.get(row.photo_id) ?? 0) + 1);
      }
      for (const row of sharesRes.data ?? []) {
        sharesMap.set(row.photo_id, (sharesMap.get(row.photo_id) ?? 0) + 1);
      }

      const allIds = new Set([...likesMap.keys(), ...sharesMap.keys()]);
      const combined: PhotoStat[] = Array.from(allIds).map((id) => ({
        photo_id: id,
        likes: likesMap.get(id) ?? 0,
        shares: sharesMap.get(id) ?? 0,
      }));

      // Sort by total engagement descending
      combined.sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares));
      setStats(combined);
      setLoading(false);
    });
  }, [open]);

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
            <>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0 text-xs text-white/40 pb-2 border-b border-white/10 mb-2 px-1">
                <span>Foto-ID</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Likes</span>
                <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Delningar</span>
              </div>
              <ul className="space-y-1">
                {stats.map((s) => (
                  <li key={s.photo_id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center rounded bg-white/5 px-3 py-2 text-sm">
                    <span className="text-white/80 truncate font-mono text-xs" title={s.photo_id}>
                      {s.photo_id}
                    </span>
                    <span className="text-white/90 tabular-nums text-center min-w-[3rem]">
                      {s.likes > 0 ? s.likes : "–"}
                    </span>
                    <span className="text-white/90 tabular-nums text-center min-w-[3rem]">
                      {s.shares > 0 ? s.shares : "–"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
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
