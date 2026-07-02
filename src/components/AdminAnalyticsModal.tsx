import { useState, useEffect, useMemo } from "react";
import { X, Loader2, BarChart3, ImageOff, Search, LayoutGrid, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  onOpenPhoto?: (photoId: string, imageUrl: string | null, title: string | null) => void;
}

type Range = "24h" | "7d" | "30d" | "all";

type EventRow = {
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

const RANGE_LABELS: Record<Range, string> = {
  "24h": "Senaste dygnet",
  "7d": "Senaste 7 dagarna",
  "30d": "Senaste 30 dagarna",
  all: "Totalt",
};

function rangeStart(r: Range): string | null {
  if (r === "all") return null;
  const now = Date.now();
  const ms = r === "24h" ? 86_400_000 : r === "7d" ? 7 * 86_400_000 : 30 * 86_400_000;
  return new Date(now - ms).toISOString();
}

function decadeLabel(y: number): string {
  if (!y || y === 0) return "ODAT.";
  return `${y}-talet`;
}

export function AdminAnalyticsModal({ open, onClose, onOpenPhoto }: AdminAnalyticsModalProps) {
  const [range, setRange] = useState<Range>("7d");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [photoMeta, setPhotoMeta] = useState<Map<string, { image_url: string | null; title: string | null }>>(new Map());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const since = rangeStart(range);

      let q = supabase
        .from("analytics_events")
        .select("event_type, event_data, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (since) q = q.gte("created_at", since);

      const [{ data: evData }, likesRes, sharesRes] = await Promise.all([
        q,
        since
          ? supabase.from("photo_likes").select("photo_id", { count: "exact", head: true }).gte("created_at", since)
          : supabase.from("photo_likes").select("photo_id", { count: "exact", head: true }),
        since
          ? supabase.from("photo_shares").select("photo_id", { count: "exact", head: true }).gte("created_at", since)
          : supabase.from("photo_shares").select("photo_id", { count: "exact", head: true }),
      ]);

      if (cancelled) return;
      const rows = (evData ?? []) as EventRow[];
      setEvents(rows);
      setLikesCount(likesRes.count ?? 0);
      setSharesCount(sharesRes.count ?? 0);

      // Enrich photo metadata for photo_open events
      const photoIds = Array.from(
        new Set(
          rows
            .filter((r) => r.event_type === "photo_open")
            .map((r) => (r.event_data as any)?.photo_id)
            .filter((v): v is string => typeof v === "string")
        )
      );
      if (photoIds.length > 0) {
        const { data: curated } = await supabase
          .from("curated_photos")
          .select("id, image_url, title")
          .in("id", photoIds);
        const m = new Map<string, { image_url: string | null; title: string | null }>();
        for (const c of curated ?? []) m.set(c.id, { image_url: c.image_url, title: c.title });
        if (!cancelled) setPhotoMeta(m);
      } else {
        setPhotoMeta(new Map());
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, range]);

  const tabStats = useMemo(() => {
    const counts = new Map<number, number>();
    for (const e of events) {
      if (e.event_type !== "tab_change") continue;
      const y = Number((e.event_data as any)?.year ?? NaN);
      if (Number.isNaN(y)) continue;
      counts.set(y, (counts.get(y) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const photoStats = useMemo(() => {
    const counts = new Map<string, { count: number; title: string | null; year: number | null }>();
    for (const e of events) {
      if (e.event_type !== "photo_open") continue;
      const d = e.event_data as any;
      const id = d?.photo_id;
      if (typeof id !== "string") continue;
      const cur = counts.get(id);
      counts.set(id, {
        count: (cur?.count ?? 0) + 1,
        title: cur?.title ?? d?.title ?? null,
        year: cur?.year ?? d?.year ?? null,
      });
    }
    return Array.from(counts.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }, [events]);

  const searchStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.event_type !== "search") continue;
      const q = String((e.event_data as any)?.query ?? "").trim().toLowerCase();
      if (!q) continue;
      counts.set(q, (counts.get(q) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [events]);

  const totals = useMemo(() => {
    let t = 0, p = 0, s = 0;
    for (const e of events) {
      if (e.event_type === "tab_change") t++;
      else if (e.event_type === "photo_open") p++;
      else if (e.event_type === "search") s++;
    }
    return { t, p, s };
  }, [events]);

  const maxTabCount = tabStats[0]?.[1] ?? 1;
  const maxPhotoCount = photoStats[0]?.count ?? 1;
  const maxSearchCount = searchStats[0]?.[1] ?? 1;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] mx-4 rounded-lg bg-stone-900 border border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Användningsstatistik
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors" aria-label="Stäng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-5 py-2 border-b border-white/10 overflow-x-auto">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                range === r ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <SummaryTile label="Flikbyten" value={totals.t} />
                <SummaryTile label="Fotoklick" value={totals.p} />
                <SummaryTile label="Sökningar" value={totals.s} />
                <SummaryTile label="Likes" value={likesCount} />
                <SummaryTile label="Delningar" value={sharesCount} />
              </div>

              {/* Tab popularity */}
              <Section icon={<LayoutGrid className="h-3.5 w-3.5" />} title={`Populäraste flikar (${tabStats.length})`}>
                {tabStats.length === 0 ? (
                  <Empty text="Inga flikbyten ännu" />
                ) : (
                  <ul className="space-y-1">
                    {tabStats.map(([y, c]) => (
                      <li key={y} className="flex items-center gap-2 text-xs text-white/80">
                        <span className="w-20 shrink-0">{decadeLabel(y)}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded overflow-hidden">
                          <div
                            className="h-full bg-white/40"
                            style={{ width: `${(c / maxTabCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-right tabular-nums text-white/60">{c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Popular photos */}
              <Section icon={<Eye className="h-3.5 w-3.5" />} title={`Mest visade bilder (topp ${photoStats.length})`}>
                {photoStats.length === 0 ? (
                  <Empty text="Inga fotoöppningar ännu" />
                ) : (
                  <ul className="space-y-1">
                    {photoStats.map((p) => {
                      const meta = photoMeta.get(p.id);
                      const img = meta?.image_url ?? null;
                      const title = meta?.title ?? p.title ?? p.id;
                      const clickable = !!onOpenPhoto;
                      return (
                        <li
                          key={p.id}
                          className={`flex items-center gap-3 rounded-md bg-white/5 px-2 py-1.5 ${
                            clickable ? "cursor-pointer hover:bg-white/10 transition-colors" : ""
                          }`}
                          onClick={() => onOpenPhoto?.(p.id, img, title)}
                        >
                          {img ? (
                            <img src={img} alt="" className="w-10 h-10 rounded object-cover bg-white/10 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                              <ImageOff className="h-4 w-4 text-white/20" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/85 truncate">{title}</p>
                            {p.year != null && (
                              <p className="text-[10px] text-white/40">{decadeLabel(Math.floor(p.year / 10) * 10)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-24">
                            <div className="flex-1 h-1.5 bg-white/5 rounded overflow-hidden">
                              <div
                                className="h-full bg-white/40"
                                style={{ width: `${(p.count / maxPhotoCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-white/60 w-6 text-right">{p.count}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>

              {/* Popular searches */}
              <Section icon={<Search className="h-3.5 w-3.5" />} title={`Populäraste sökningar (topp ${searchStats.length})`}>
                {searchStats.length === 0 ? (
                  <Empty text="Inga sökningar ännu" />
                ) : (
                  <ul className="space-y-1">
                    {searchStats.map(([q, c]) => (
                      <li key={q} className="flex items-center gap-2 text-xs text-white/80">
                        <span className="flex-1 truncate">"{q}"</span>
                        <div className="w-24 h-1.5 bg-white/5 rounded overflow-hidden">
                          <div
                            className="h-full bg-white/40"
                            style={{ width: `${(c / maxSearchCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right tabular-nums text-white/60">{c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/30 text-center">
            Helt anonym data. Ingen IP eller användare kopplas till händelserna.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white/5 px-3 py-2 text-center">
      <div className="text-lg font-semibold text-white tabular-nums">{value.toLocaleString("sv-SE")}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-white/30 py-2">{text}</p>;
}
