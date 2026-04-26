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
          {/* Glossy dark-green enameled archive cabinet drawer */}
          <div
            className="relative px-3 pt-2 pb-4 sm:px-6 sm:pt-4 sm:pb-6 lg:px-8 lg:pt-5 lg:pb-7"
            style={{
              // Deep enamel green base — slightly lighter at the top where light hits the curved drawer face
              background:
                "linear-gradient(180deg, #1f4a32 0%, #173a26 30%, #11301f 65%, #0c2417 100%)",
              boxShadow:
                // Outer drop shadow + crisp top highlight (curved metal lip catching light) + dark inner bottom edge
                "0 8px 18px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.7)",
            }}
          >
            {/* Photorealistic enamel lacquer: broad soft sheen + faint diagonal highlight + slight wear at the bottom */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  // Curved top sheen — thin bright band where light hits the rolled metal edge
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 8%, transparent 18%), " +
                  // Soft diagonal lacquer reflection across the drawer face
                  "linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.06) 28%, rgba(255, 255, 255, 0.10) 38%, transparent 55%), " +
                  // Subtle vignette toward bottom — paint deepens away from the light
                  "linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.08) 18%, transparent 35%), " +
                  // Very faint enamel grain so it doesn't read as plastic
                  "radial-gradient(ellipse 130% 90% at 50% 30%, rgba(255, 255, 255, 0.05), transparent 60%)",
                opacity: 1,
              }}
            />
            {/* Polished metal top rail — bright reflective edge of the drawer */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-0 h-[3px]"
              style={{
                background:
                  "linear-gradient(180deg, #d4d6d8 0%, #8a8d90 45%, #3b3e41 80%, #1a1c1e 100%)",
                boxShadow: "0 1px 0 rgba(0,0,0,0.4)",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h1
                  className={`font-semibold font-slab uppercase tracking-[0.12em] sm:tracking-[0.2em] sm:text-3xl transition-[font-size] duration-200 ${headerShrunk ? "text-base" : "text-xl"}`}
                  style={{
                    color: '#f0eee8',
                    textShadow: "0 1px 0 rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.4)",
                  }}
                >
                  KTH i bilder
                </h1>
                <div className="flex items-center gap-2">
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
              </div>
              <div
                className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ${headerShrunk ? "max-h-0 opacity-0 sm:max-h-40 sm:opacity-100" : "max-h-40 opacity-100"}`}
              >
                <p className="text-[10px] sm:text-xs leading-relaxed mt-1 max-w-3xl" style={{ color: 'rgba(240, 238, 232, 0.78)', fontFamily: "'Courier Prime', monospace" }}>
                  <span className="sm:hidden">En samlingsplats för KTH-fotografier från öppna arkiv.</span>
                  <span className="hidden sm:inline">
                    En samlingsplats för fotografier med koppling till Kungliga Tekniska Högskolan (KTH).<br />
                    Bilderna hämtas från de öppna arkiven Alvin, Digitala Stadsmuseet, DigitaltMuseum,<br />
                    Europeana, K-samsök, Stockholmskällan och Wikimedia Commons.
                  </span>
                </p>
              </div>
            </div>
            {/* Drawer front lip — thin darker band at the bottom that the folder tabs peek up behind */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-[6px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.7) 100%)",
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
