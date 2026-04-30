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
import archiveCabinetClean from "@/assets/archive-cabinet-clean.jpg";
import labelHolder from "@/assets/label-holder.png";
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
      <header className="shrink-0 relative" style={{ zIndex: 1 }}>
        {/* Photographic archive cabinet drawer — uses a real generated photo as the backdrop.
            The silver label holder is centered. We use 100% 100% sizing so the
            entire drawer face is always visible — no cropping. */}
        <div
          className={`relative w-full overflow-hidden transition-[height] duration-300`}
          style={{
            // The drawer image is now a clean cabinet face (no label) so we can
            // always use background-size: cover. The silver label holder is a
            // separately positioned overlay below, which lets us scale it
            // independently per breakpoint.
            height: headerShrunk ? "clamp(110px, 14vw, 160px)" : "clamp(200px, 32vw, 360px)",
            backgroundImage: `url(${archiveCabinetClean})`,
            backgroundSize: "115% 100%",
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

          {/* Dymo-remsa: sök + info, klistrad på lådans övre högra del. I
              expanderat läge sitter de en bit ner på själva lådfronten (inte
              vid bildens topp- eller sidkant). I kompakt läge centreras de
              vertikalt så de hamnar bredvid silveretiketten. */}
          <div
            className="absolute z-20"
            style={{
              top: headerShrunk
                ? "50%"
                : ((wantsAdmin || isAdmin) ? "calc(18% + 44px)" : "18%"),
              right: "5%",
              transform: headerShrunk
                ? "translateY(-50%) rotate(1.2deg)"
                : "rotate(1.2deg)",
              transformOrigin: "center right",
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

          {/* Silver label holder — separate overlay image so it scales
              independently from the drawer background. The holder image has a
              ~2:1 aspect (frame visually), so we set width and let height
              follow naturally. Title text is positioned absolutely over the
              inner paper area of the holder. */}
          <div
            className="absolute left-1/2 top-1/2 z-10"
            style={{
              transform: "translate(-50%, -50%)",
              // Width scales with viewport but is capped so it never dominates
              // on huge screens or shrinks too small on phones. In compact mode
              // we shrink it slightly to fit the reduced header height.
              width: headerShrunk
                ? "clamp(220px, 36vw, 360px)"
                : "clamp(240px, 46vw, 620px)",
            }}
          >
            <img
              src={labelHolder}
              alt=""
              aria-hidden
              className="block w-full h-auto select-none pointer-events-none"
              draggable={false}
              style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))" }}
            />
            {/* Inner paper area of the label holder is roughly the central
                64% width × 24% height of the PNG. Position the text there. */}
            <div
              className="absolute text-center flex flex-col justify-center items-center"
              style={{
                left: "18%",
                right: "18%",
                top: "38%",
                bottom: "38%",
                padding: "0 2%",
              }}
            >
              <h1
                className={`font-slab uppercase tracking-[0.18em] leading-none transition-[font-size] duration-200 ${headerShrunk ? "text-[12px] sm:text-sm md:text-base" : "text-sm sm:text-base md:text-xl lg:text-2xl"}`}
                style={{ color: "#2a2418", fontWeight: 700 }}
              >
                KTH i bilder
              </h1>
              {!headerShrunk && (
                <p
                  className="mt-1 sm:mt-1.5 text-[6px] sm:text-[8px] md:text-[10px] lg:text-[10px] xl:text-[11px] leading-tight text-center xl:text-left"
                  style={{ color: "#3d3424", fontFamily: "'Courier Prime', monospace", letterSpacing: "0.02em" }}
                >
                  {/* Tre varianter: kort (mobil), medel (tablet/liten desktop), lång (full desktop) */}
                  <span className="sm:hidden">Fotografier från öppna arkiv</span>
                  <span className="hidden sm:inline xl:hidden">Fotografier från öppna arkiv</span>
                  <span className="hidden xl:inline">
                    En samlingsplats för fotografier med koppling till Kungliga Tekniska Högskolan (KTH). Bilderna hämtas från de öppna arkiven Alvin, Digitala Stadsmuseet, DigitaltMuseum, Europeana, K-samsök, Stockholmskällan och Wikimedia Commons.
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dark interior of the open cabinet — just enough height for the folder
            tabs to peek up behind the manila paper, with no visible gap below. */}
        <div
            className={`relative overflow-hidden px-2 sm:px-4 lg:px-8 xl:px-10 ${headerShrunk ? "pt-1" : "pt-3"}`}
          style={{
            backgroundColor: "#000000",
            boxShadow:
              "inset 0 12px 18px -6px rgba(0, 0, 0, 0.95), inset 0 2px 4px rgba(0, 0, 0, 1)",
            zIndex: 1,
            height: headerShrunk ? "70px" : "82px",
          }}
        >
          <div className="relative">
            <ArchiveTabs year={year} onChange={handleYearChange} compact={headerShrunk} />
          </div>
        </div>
      </header>

      <main
        className="flex flex-col flex-1 min-h-0 overflow-hidden relative isolate"
        style={{ backgroundColor: getArchivePaperBeige().color, zIndex: 5, marginTop: headerShrunk ? "-18px" : "-22px", boxShadow: "0 -3px 8px rgba(0,0,0,0.5), inset 0 6px 8px -4px rgba(0,0,0,0.25)" }}
      >
        {/* Photorealistic manilla folder paper texture — fills the open folder area
            and stretches responsively across all viewports. The folder paper rises
            slightly above the tab base so tabs appear to come from BEHIND the paper. */}
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
