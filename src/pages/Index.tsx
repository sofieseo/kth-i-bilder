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
import { getPaperStyle, getArchivePaperBeige } from "@/lib/paperColor";

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
        // Dark "room" backdrop behind the cabinet — deep neutral so the green pops
        backgroundColor: "#1a1814",
      }}
    >
      {/* Subtle room vignette so the cabinet feels lit from above */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255, 255, 255, 0.04), transparent 60%), " +
            "radial-gradient(ellipse 140% 100% at 50% 100%, rgba(0, 0, 0, 0.55), transparent 70%)",
          opacity: 1,
        }}
      />
      <header className="shrink-0 relative z-20">
        {/* Cabinet drawer spans edge-to-edge — no folder paper shows above or beside it */}
        <div>
          {/* Worn olive-green painted steel archive cabinet drawer */}
          <div
            className="relative px-3 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4 lg:px-8 lg:pt-5 lg:pb-5"
            style={{
              // Muted olive/sage paint — flatter and more matte than enamel
              background:
                "linear-gradient(180deg, #4a5840 0%, #3d4a35 35%, #34402d 70%, #2a3424 100%)",
              boxShadow:
                "0 8px 18px rgba(0, 0, 0, 0.55), inset 0 -1px 0 rgba(0, 0, 0, 0.7)",
            }}
          >
            {/* Worn matte paint: subtle vertical streaking + uneven wear patches */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  // Faint vertical brushstroke streaking
                  "repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 7px), " +
                  // Uneven dirt/wear patches
                  "radial-gradient(ellipse 35% 60% at 8% 30%, rgba(0,0,0,0.18), transparent 70%), " +
                  "radial-gradient(ellipse 30% 50% at 92% 70%, rgba(0,0,0,0.16), transparent 70%), " +
                  "radial-gradient(ellipse 25% 40% at 45% 85%, rgba(0,0,0,0.12), transparent 70%), " +
                  // Faint dust/scratches
                  "radial-gradient(circle at 22% 55%, rgba(180, 175, 150, 0.06) 0.5px, transparent 1.5px), " +
                  "radial-gradient(circle at 67% 38%, rgba(180, 175, 150, 0.05) 0.4px, transparent 1.2px)",
                opacity: 1,
              }}
            />
            {/* Heavy paint chipping along the very top edge — exposing lighter primer/metal */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-0 h-[5px]"
              style={{
                backgroundImage:
                  // Irregular chipping pattern using overlapping radials
                  "radial-gradient(ellipse 18px 4px at 6% 0%, #c9c2a8 50%, transparent 70%), " +
                  "radial-gradient(ellipse 12px 3px at 19% 0%, #b8b09a 55%, transparent 75%), " +
                  "radial-gradient(ellipse 22px 5px at 31% 0%, #d4cdb4 50%, transparent 70%), " +
                  "radial-gradient(ellipse 14px 3px at 44% 0%, #b0a890 55%, transparent 75%), " +
                  "radial-gradient(ellipse 20px 4px at 58% 0%, #c2bba0 50%, transparent 72%), " +
                  "radial-gradient(ellipse 16px 4px at 72% 0%, #b8b09a 55%, transparent 75%), " +
                  "radial-gradient(ellipse 24px 5px at 86% 0%, #cec7ae 48%, transparent 70%), " +
                  "radial-gradient(ellipse 12px 3px at 96% 0%, #a89f88 55%, transparent 75%), " +
                  "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 100%)",
              }}
            />
            {/* Top control row: search + admin buttons */}
            <div className="relative z-10">
              <div className="flex items-center justify-end gap-2">
                <SearchPalette
                  year={year}
                  reopenSignal={reopenSearchSignal}
                  onSelect={(photo, results) => {
                    setSearchNavSet(results);
                    setSearchSelectedPhoto(photo);
                  }}
                />
                {wantsAdmin && !isAdmin && (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                    style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace" }}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Logga in
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowStats(true)}
                      className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace" }}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Statistik
                    </button>
                    <button
                      onClick={() => setShowHidden(true)}
                      className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace" }}
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Dolda ({hiddenIds.size})
                    </button>
                    <button
                      onClick={handleClearCache}
                      disabled={clearingCache}
                      title={year === 0 ? "Rensa cache för odaterade" : `Rensa cache för ${Math.floor(year / 10) * 10}-talet`}
                      className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace" }}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${clearingCache ? "animate-spin" : ""}`} />
                      Rensa cache
                    </button>
                    <button
                      onClick={handleLogout}
                      className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace" }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logga ut
                    </button>
                  </>
                )}
              </div>

              {/* Brass label holder — centered card with title and subtitle, like the reference image */}
              <div
                className={`mx-auto overflow-hidden transition-all duration-200 ${headerShrunk ? "mt-2 max-w-[260px] sm:max-w-md" : "mt-3 max-w-md sm:max-w-xl"}`}
              >
                {/* Brass frame */}
                <div
                  className="relative px-1 py-1"
                  style={{
                    background:
                      "linear-gradient(180deg, #d4b878 0%, #b8964a 25%, #8a6a30 55%, #b8964a 80%, #d4b878 100%)",
                    boxShadow:
                      "0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,235,180,0.6), inset 0 -1px 0 rgba(60,40,10,0.5)",
                  }}
                >
                  {/* Tiny brass screws in corners */}
                  <span aria-hidden className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #f4d98a, #6b4f1c)" }} />
                  <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #f4d98a, #6b4f1c)" }} />
                  <span aria-hidden className="absolute left-1 bottom-1 h-1.5 w-1.5 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #f4d98a, #6b4f1c)" }} />
                  <span aria-hidden className="absolute right-1 bottom-1 h-1.5 w-1.5 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #f4d98a, #6b4f1c)" }} />
                  {/* Aged paper label card */}
                  <div
                    className={`text-center ${headerShrunk ? "px-3 py-1" : "px-4 py-2 sm:py-3"}`}
                    style={{
                      background:
                        "linear-gradient(180deg, #f1e7c8 0%, #e8dab0 60%, #d9c592 100%)",
                      boxShadow: "inset 0 1px 2px rgba(120,90,40,0.25)",
                    }}
                  >
                    <h1
                      className={`font-slab uppercase tracking-[0.18em] transition-[font-size] duration-200 ${headerShrunk ? "text-sm sm:text-lg" : "text-lg sm:text-2xl"}`}
                      style={{
                        color: "#3a2810",
                        fontWeight: 700,
                      }}
                    >
                      KTH i bilder
                    </h1>
                    <div
                      className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ${headerShrunk ? "max-h-0 opacity-0 sm:max-h-20 sm:opacity-100 sm:mt-1" : "max-h-20 opacity-100 mt-1"}`}
                    >
                      <p className="text-[10px] sm:text-xs leading-snug" style={{ color: "#5a3f18", fontFamily: "'Courier Prime', monospace" }}>
                        <span className="sm:hidden">Ett bildarkiv från öppna källor.</span>
                        <span className="hidden sm:inline">Fotografier med koppling till Kungliga Tekniska Högskolan, från Alvin, Digitala Stadsmuseet, DigitaltMuseum, Europeana, K-samsök, Stockholmskällan och Wikimedia Commons.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Drawer front lip — thin darker band at the bottom that the folder tabs peek up behind */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-[6px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.75) 100%)",
              }}
            />
          </div>
        </div>

        {/* Dark interior of the open cabinet — folder tabs rise up out of the shadow */}
        <div
          className={`relative px-2 sm:px-4 lg:px-8 xl:px-10 ${headerShrunk ? "pt-3 pb-0" : "pt-5 pb-0"} z-10`}
          style={{
            // Deep shadow inside the drawer — almost black, with a subtle gradient suggesting depth
            background:
              "linear-gradient(180deg, #050403 0%, #0a0806 40%, #110d08 80%, #1a1410 100%)",
            boxShadow:
              // Strong inner shadow at the top — the drawer's front lip casts a shadow down into the interior
              "inset 0 12px 18px -6px rgba(0, 0, 0, 0.85), inset 0 2px 4px rgba(0, 0, 0, 0.95)",
          }}
        >
          <ArchiveTabs year={year} onChange={handleYearChange} compact={headerShrunk} />
        </div>
      </header>

      <main
        className="flex flex-col flex-1 min-h-0 overflow-hidden relative"
        style={{ backgroundColor: getArchivePaperBeige().color }}
      >
        {/* Photorealistic manilla folder texture inside the open folder area */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(80, 55, 20, 0.05) 0 0.5px, transparent 0.5px 3px), " +
              "repeating-linear-gradient(0deg, rgba(80, 55, 20, 0.03) 0 0.5px, transparent 0.5px 5px), " +
              "radial-gradient(ellipse at 12% 18%, rgba(160, 115, 50, 0.10), transparent 45%), " +
              "radial-gradient(ellipse at 88% 22%, rgba(120, 80, 30, 0.08), transparent 50%), " +
              "radial-gradient(ellipse at 22% 78%, rgba(120, 80, 30, 0.07), transparent 55%), " +
              "radial-gradient(ellipse at 78% 82%, rgba(160, 115, 50, 0.09), transparent 50%), " +
              "radial-gradient(circle at 17% 34%, rgba(70, 45, 15, 0.18) 0.6px, transparent 1.4px), " +
              "radial-gradient(circle at 63% 21%, rgba(70, 45, 15, 0.16) 0.5px, transparent 1.2px), " +
              "radial-gradient(circle at 41% 67%, rgba(70, 45, 15, 0.15) 0.7px, transparent 1.5px), " +
              "radial-gradient(circle at 84% 56%, rgba(70, 45, 15, 0.14) 0.5px, transparent 1.2px), " +
              "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 60%, rgba(60, 40, 15, 0.18) 100%)",
            mixBlendMode: "multiply",
          }}
        />
        <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <PhotoGallery
          year={year}
          results={visibleResults}
          loading={loading}
          isAdmin={isAdmin}
          onHidePhoto={handleHidePhoto}
          onMarkUndated={handleMarkUndated}
          onSwipeDecade={(direction) => {
            const decades = [0, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
            const idx = decades.indexOf(year);
            if (idx === -1) return;
            if (direction === "next" && idx < decades.length - 1) handleYearChange(decades[idx + 1]);
            if (direction === "prev" && idx > 0) handleYearChange(decades[idx - 1]);
          }}
          openPhoto={searchSelectedPhoto}
          openPhotoNavSet={searchNavSet ?? undefined}
          onPhotoOpened={() => {
            // keep state so the lightbox knows it came from search
          }}
          onLightboxClosed={() => {
            const wasFromSearch = !!searchSelectedPhoto;
            setSearchSelectedPhoto(null);
            setSearchNavSet(null);
            if (wasFromSearch) setReopenSearchSignal((n) => n + 1);
          }}
          onScroll={(top) => setScrollTop(top)}
          scrollToTopSignal={scrollToTopSignal}
        />
        </div>
      </main>

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
