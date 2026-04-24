import { useMemo, useState, useRef, useEffect } from "react";
import { EyeOff, BarChart3, LogIn, LogOut, RefreshCw, ArrowUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SearchPalette } from "@/components/SearchPalette";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArchiveTabs } from "@/components/ArchiveTabs";
import { PhotoGallery } from "@/components/PhotoGallery";
import { HiddenPhotosModal } from "@/components/HiddenPhotosModal";
import { AdminStatsModal } from "@/components/AdminStatsModal";
import { AdminLoginModal } from "@/components/AdminLoginModal";
import { usePhotoFetch } from "@/hooks/usePhotoFetch";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useHiddenPhotos } from "@/hooks/useHiddenPhotos";
import { useUndatedPhotos } from "@/hooks/useUndatedPhotos";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";
import { getPaperStyle, getArchiveHeaderPaper, getArchivePaperBeige } from "@/lib/paperColor";

const Index = () => {
  const { year, results, loading, handleYearChange } = usePhotoFetch(0);
  const { isAdmin, wantsAdmin } = useAdminMode();
  const { hiddenIds, hidePhoto, restorePhoto } = useHiddenPhotos();
  const { undatedIds, markAsUndated } = useUndatedPhotos();
  const queryClient = useQueryClient();
  const [showHidden, setShowHidden] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [searchSelectedPhoto, setSearchSelectedPhoto] = useState<UnifiedPhoto | null>(null);
  const [searchNavSet, setSearchNavSet] = useState<UnifiedPhoto[] | null>(null);
  const [reopenSearchSignal, setReopenSearchSignal] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0);
  // Shrink header on mobile after a small scroll threshold
  const headerShrunk = scrollTop > 40;
  const showBackToTop = scrollTop > 40;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Utloggad");
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // Always invalidate the undated bucket alongside the active decade
      const keys = year === 0
        ? ["7:0"]
        : [`7:${Math.floor(year / 10) * 10}`, "7:0"];
      const { error } = await supabase
        .from("api_cache")
        .delete()
        .or(keys.map((k) => `decade.like.%${k}%`).join(","));
      if (error) throw error;
      // Drop client-side React Query cache so the next fetch hits the network
      await queryClient.invalidateQueries({ queryKey: ["photos"] });
      toast.success(year === 0 ? "Cachen rensad för odaterade" : `Cachen rensad för ${Math.floor(year / 10) * 10}-talet`);
    } catch (e) {
      console.error(e);
      toast.error("Kunde inte rensa cachen");
    } finally {
      setClearingCache(false);
    }
  };

  /** Delete all api_cache rows whose decade key contains the given year bucket */
  const invalidateCacheForYear = async (photoYear: number | null) => {
    // Invalidate both the decade the photo belonged to and the undated bucket
    const keys: string[] = ["7:0"]; // always invalidate undated
    if (photoYear != null) {
      const decade = Math.floor(photoYear / 10) * 10;
      keys.push(`7:${decade}`);
    }
    for (const key of keys) {
      await supabase.from("api_cache").delete().like("decade", `%${key}%`);
    }
  };

  const handleHidePhoto = async (id: string, imageUrl?: string) => {
    const photo = results.find((p) => p.id === id);
    await hidePhoto(id, imageUrl);
    toast.success("Bilden är dold");
    invalidateCacheForYear(photo?.year ?? null);
  };

  const handleMarkUndated = async (id: string) => {
    const photo = results.find((p) => p.id === id);
    await markAsUndated(id);
    toast.success("Bilden är markerad som odaterad");
    invalidateCacheForYear(photo?.year ?? null);
  };

  const handleRestorePhoto = async (id: string) => {
    await restorePhoto(id);
    toast.success("Bilden är återställd");
    invalidateCacheForYear(null);
  };

  // Keep a cache of full photo objects that have been marked undated
  const undatedPhotosRef = useRef<Map<string, UnifiedPhoto>>(new Map());

  // When results change, capture any undated photo objects
  useEffect(() => {
    for (const p of results) {
      if (undatedIds.has(p.id)) {
        undatedPhotosRef.current.set(p.id, { ...p, year: null });
      }
    }
  }, [results, undatedIds]);

  const visibleResults = useMemo(() => {
    const isUndatedMode = year === 0;

    if (isUndatedMode) {
      // Show API results (already null-year) + injected undated photos
      const apiResults = results.filter((p) => !hiddenIds.has(p.id));
      const injected: UnifiedPhoto[] = [];
      for (const [id, photo] of undatedPhotosRef.current) {
        if (!hiddenIds.has(id) && !apiResults.some((p) => p.id === id)) {
          injected.push(photo);
        }
      }
      return [...apiResults, ...injected];
    }

    // Non-undated mode: filter out undated photos so they don't appear in wrong decade
    return results
      .filter((p) => !hiddenIds.has(p.id) && !undatedIds.has(p.id));
  }, [results, hiddenIds, undatedIds, year]);

  return (
    <div
      className="relative flex w-screen flex-col transition-colors duration-300"
      style={{
        height: "100dvh",
        backgroundColor: getArchivePaperBeige().color,
      }}
    >
      {/* Lined-paper texture overlay matching the search/info dialog */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(120, 95, 50, 0.06) 0 1px, transparent 1px 7px), radial-gradient(ellipse at 18% 22%, rgba(120, 95, 50, 0.06), transparent 55%), radial-gradient(ellipse at 82% 78%, rgba(120, 95, 50, 0.07), transparent 60%)",
          mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />
      <header className="shrink-0">
        {/* Outer wrapper: leaves beige paper visible above + on the sides so the
            green header looks like an archive sheet resting on the folders */}
        <div className={`px-2 sm:px-4 lg:px-8 xl:px-10 ${headerShrunk ? "pt-2 sm:pt-3" : "pt-4 sm:pt-6"}`}>
          {/* Archive-green paper backdrop */}
          <div
            className="relative px-3 py-2 sm:px-6 sm:py-4 lg:px-8 lg:py-5"
            style={{
              backgroundColor: getArchiveHeaderPaper().color,
              boxShadow:
                "0 1px 0 rgba(255, 255, 240, 0.35) inset, 0 -1px 2px rgba(40, 60, 45, 0.18) inset, 0 6px 14px -4px rgba(40, 55, 45, 0.30), 0 14px 24px -8px rgba(40, 55, 45, 0.20), 2px 3px 6px rgba(40, 55, 45, 0.18)",
            }}
          >
            {/* Lined-paper texture matching the dialog look */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(40, 60, 45, 0.07) 0 1px, transparent 1px 7px), radial-gradient(ellipse at 20% 25%, rgba(40, 60, 45, 0.06), transparent 60%), radial-gradient(ellipse at 80% 75%, rgba(40, 60, 45, 0.05), transparent 60%)",
                mixBlendMode: "multiply",
                opacity: 0.9,
              }}
            />

      {/* Back to top button */}
      <button
        type="button"
        aria-label="Tillbaka till toppen"
        onClick={() => setScrollToTopSignal((n) => n + 1)}
        className={`ink-border z-40 inline-flex h-8 w-8 items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.45)] transition-all duration-200 ${
          showBackToTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        style={{
          color: '#1a1208',
          backgroundColor: getPaperStyle(year).color,
          position: 'fixed',
          right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          left: 'auto',
        }}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>

      <HiddenPhotosModal open={showHidden} onClose={() => setShowHidden(false)} onRestore={handleRestorePhoto} />
      <AdminStatsModal open={showStats} onClose={() => setShowStats(false)} />
      <AdminLoginModal open={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
};

export default Index;
