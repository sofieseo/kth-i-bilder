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
import archiveCabinetHeader from "@/assets/archive-cabinet-header.jpg";
import manilaFolderTexture from "@/assets/manila-folder-texture.jpg";

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
      <header className="shrink-0 relative z-10">
        {/* Photographic archive cabinet drawer — uses a real generated photo as the backdrop.
            The silver label holder is centered. We use 100% 100% sizing so the
            entire drawer face is always visible — no cropping. */}
        <div
          className={`relative w-full overflow-hidden transition-[height] duration-300`}
          style={{
            // Image is 1920x1088 (~16:9). We use background-size: 100% 100% so the
            // ENTIRE drawer (including the silver label holder) is always visible
            // on every viewport — no cropping. Height scales with viewport width
            // so the cabinet keeps its natural proportions.
            height: headerShrunk ? "110px" : "clamp(200px, 32vw, 360px)",
            backgroundImage: `url(${archiveCabinetHeader})`,
            backgroundSize: "100% 100%",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#7d8a6a",
            boxShadow: "0 8px 18px rgba(0, 0, 0, 0.55), inset 0 -1px 0 rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Subtle top/bottom darkening so overlaid controls stay readable on lighter areas */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.10) 28%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.30) 100%)",
            }}
          />

          {/* Dymo label strip — sök & info "klistrade" på lådans övre högra hörn.
              Lätt rotation ger känslan av en handpåklistrad etikett. Admin-knapparna
              behåller sin tidigare stil och ligger på en egen rad ovanför. */}
          {(wantsAdmin || isAdmin) && (
            <div className="absolute top-0 left-0 right-0 z-10 px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3">
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {wantsAdmin && !isAdmin && (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                    style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace", backgroundColor: 'rgba(0,0,0,0.35)' }}
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
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace", backgroundColor: 'rgba(0,0,0,0.35)' }}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Statistik
                    </button>
                    <button
                      onClick={() => setShowHidden(true)}
                      className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace", backgroundColor: 'rgba(0,0,0,0.35)' }}
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Dolda ({hiddenIds.size})
                    </button>
                    <button
                      onClick={handleClearCache}
                      disabled={clearingCache}
                      title={year === 0 ? "Rensa cache för odaterade" : `Rensa cache för ${Math.floor(year / 10) * 10}-talet`}
                      className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace", backgroundColor: 'rgba(0,0,0,0.35)' }}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${clearingCache ? "animate-spin" : ""}`} />
                      Rensa cache
                    </button>
                    <button
                      onClick={handleLogout}
                      className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                      style={{ color: '#f0eee8', borderColor: 'rgba(240,238,232,0.55)', fontFamily: "'Courier Prime', monospace", backgroundColor: 'rgba(0,0,0,0.35)' }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logga ut
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Dymo-remsa: sök + info, klistrad på övre vänstra delen av lådan
              (logisk plats — på den platta målade ytan, inte i någon skarv).
              Lite rotation ger en autentisk "tejpad" känsla. */}
          <div
            className="absolute z-20"
            style={{
              top: (wantsAdmin || isAdmin) ? "44px" : "10px",
              left: "12px",
              transform: "rotate(-1.2deg)",
              transformOrigin: "top left",
            }}
          >
            <SearchPalette
              light
              year={year}
              reopenSignal={reopenSearchSignal}
              onSelect={(photo, results) => {
                setSearchNavSet(results);
                setSearchSelectedPhoto(photo);
              }}
            />
          </div>

          {/* Title positioned over the silver metal label holder in the photograph.
              Label holder is centered horizontally and vertically at ~48%, ~50% wide. */}
          <div
            className="absolute left-1/2 z-10 text-center"
            style={{
              top: "49%",
              transform: "translate(-50%, -50%)",
              width: headerShrunk ? "min(60vw, 320px)" : "min(48vw, 540px)",
              maxHeight: headerShrunk ? "60%" : "26%",
              padding: "0 1%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <h1
              className={`font-slab uppercase tracking-[0.18em] leading-none transition-[font-size] duration-200 ${headerShrunk ? "text-sm sm:text-base" : "text-sm sm:text-base md:text-lg lg:text-xl"}`}
              style={{
                color: "#2a2418",
                fontWeight: 700,
              }}
            >
              KTH i bilder
            </h1>
            {!headerShrunk && (
              <p
                className="mt-1 sm:mt-1.5 text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] leading-snug"
                style={{ color: "#3d3424", fontFamily: "'Courier Prime', monospace" }}
              >
                <span className="sm:hidden">En samlingsplats för KTH-fotografier från öppna arkiv</span>
                <span className="hidden sm:inline">En samlingsplats för fotografier med koppling till Kungliga Tekniska Högskolan (KTH). Bilderna hämtas från de öppna arkiven Alvin, Digitala Stadsmuseet, DigitaltMuseum, Europeana, K-samsök, Stockholmskällan och Wikimedia Commons.</span>
              </p>
            )}
          </div>
        </div>

        {/* Dark interior of the open cabinet — solid black so the manila folder tabs
            stand out cleanly. A strong top inner shadow keeps the "drawer lip" feel. */}
        <div
          className={`relative px-2 sm:px-4 lg:px-8 xl:px-10 ${headerShrunk ? "pt-3 pb-0" : "pt-5 pb-0"} z-10`}
          style={{
            backgroundColor: "#000000",
            boxShadow:
              // Strong inner shadow at the top — the drawer's front lip casts a shadow down into the interior
              "inset 0 12px 18px -6px rgba(0, 0, 0, 0.95), inset 0 2px 4px rgba(0, 0, 0, 1)",
          }}
        >
          <div className="relative">
            <ArchiveTabs year={year} onChange={handleYearChange} compact={headerShrunk} />
          </div>
        </div>
      </header>

      <main
        className="flex flex-col flex-1 min-h-0 overflow-hidden relative"
        style={{ backgroundColor: getArchivePaperBeige().color }}
      >
        {/* Photorealistic manilla folder paper texture — fills the open folder area
            and stretches responsively across all viewports. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${manilaFolderTexture})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            opacity: 0.85,
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
