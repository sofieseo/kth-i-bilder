import { useMemo, useState, useRef, useEffect } from "react";
import { EyeOff, BarChart3, LogIn, LogOut, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SearchPalette } from "@/components/SearchPalette";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TimeSlider } from "@/components/TimeSlider";
import { PhotoGallery } from "@/components/PhotoGallery";
import { HiddenPhotosModal } from "@/components/HiddenPhotosModal";
import { AdminStatsModal } from "@/components/AdminStatsModal";
import { AdminLoginModal } from "@/components/AdminLoginModal";
import { usePhotoFetch } from "@/hooks/usePhotoFetch";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useHiddenPhotos } from "@/hooks/useHiddenPhotos";
import { useUndatedPhotos } from "@/hooks/useUndatedPhotos";
import type { UnifiedPhoto } from "@/data/fetchAllPhotos";
import { getPaperStyle, getPaperBackgroundImage, getPageCurl } from "@/lib/paperColor";

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
    <div className="relative flex h-screen w-screen flex-col">
      {/* Blurred brick background layer */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/images/brick-bg.jpg')",
          backgroundSize: "600px",
          backgroundPosition: "center",
          filter: "blur(1.5px) brightness(0.75)",
          transform: "scale(1.03)",
        }}
      />
      {/* Dark overlay to push texture into the background */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-black/40" />
      <header
        className="shrink-0 px-2 py-1.5 sm:px-4 sm:py-3"
        style={(() => {
          const { color, spots } = getPaperStyle(year);
          const spotsImage = getPaperBackgroundImage(year);
          return {
            ['--paper-color' as any]: color,
            ['--paper-spots' as any]: String(spots),
            ['--paper-spots-image' as any]: spotsImage,
          };
        })()}
      >
         <div className="paper-aged px-3 py-2 sm:px-6 sm:py-3 shadow-[0_18px_40px_-8px_rgba(0,0,0,0.7)]">
              {(() => {
                const curl = getPageCurl(year);
                return curl ? <div aria-hidden className={`page-curl ${curl.corner}`} /> : null;
              })()}
              <div className="relative z-10 flex items-center justify-between">
                <h1 className="text-xl sm:text-3xl font-semibold font-slab uppercase tracking-[0.12em] sm:tracking-[0.2em]" style={{ color: '#1a1208' }}>
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
                      style={{ color: '#1a1208', fontFamily: "'Courier Prime', monospace" }}
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
                        style={{ color: '#1a1208', fontFamily: "'Courier Prime', monospace" }}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Statistik
                      </button>
                      <button
                        onClick={() => setShowHidden(true)}
                        className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                        style={{ color: '#1a1208', fontFamily: "'Courier Prime', monospace" }}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Dolda ({hiddenIds.size})
                      </button>
                      <button
                        onClick={handleClearCache}
                        disabled={clearingCache}
                        title={year === 0 ? "Rensa cache för odaterade" : `Rensa cache för ${Math.floor(year / 10) * 10}-talet`}
                        className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                        style={{ color: '#1a1208', fontFamily: "'Courier Prime', monospace" }}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${clearingCache ? "animate-spin" : ""}`} />
                        Rensa cache
                      </button>
                      <button
                        onClick={handleLogout}
                        className="ink-border flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors"
                        style={{ color: '#1a1208', fontFamily: "'Courier Prime', monospace" }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logga ut
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="relative z-10 text-[10px] sm:text-xs leading-relaxed mt-1 max-w-3xl" style={{ color: 'rgba(26, 18, 8, 0.78)', fontFamily: "'Courier Prime', monospace" }}>
                <span className="sm:hidden">En samlingsplats för KTH-fotografier från öppna arkiv.</span>
                <span className="hidden sm:inline">En samlingsplats för fotografier med koppling till Kungliga Tekniska Högskolan (KTH). Bilderna hämtas från de öppna arkiven Alvin, Digitala Stadsmuseet, DigitaltMuseum, Europeana, K-samsök, Stockholmskällan och Wikimedia Commons.</span>
              </p>
              <div className="relative z-10 mt-2 sm:mt-4 pt-2 sm:pt-4" style={{ borderTop: '1px dashed rgba(26, 18, 8, 0.35)' }}>
                <TimeSlider year={year} onChange={handleYearChange} />
              </div>
           </div>
      </header>

      <PhotoGallery
        results={visibleResults}
        year={year}
        loading={loading}
        isAdmin={isAdmin}
        onHidePhoto={handleHidePhoto}
        onMarkUndated={isAdmin ? handleMarkUndated : undefined}
        openPhoto={searchSelectedPhoto}
        openPhotoNavSet={searchNavSet}
        onPhotoOpened={() => setSearchSelectedPhoto(null)}
        onLightboxClosed={(wasFromSearch) => {
          if (wasFromSearch) {
            setSearchNavSet(null);
            setReopenSearchSignal((n) => n + 1);
          }
        }}
      />

      <HiddenPhotosModal open={showHidden} onClose={() => setShowHidden(false)} onRestore={handleRestorePhoto} />
      <AdminStatsModal open={showStats} onClose={() => setShowStats(false)} />
      <AdminLoginModal open={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
};

export default Index;
