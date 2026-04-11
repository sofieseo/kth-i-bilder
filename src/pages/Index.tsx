import { useMemo, useState, useRef, useEffect } from "react";
import { EyeOff, BarChart3, LogIn, LogOut } from "lucide-react";
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

const Index = () => {
  const { year, results, loading, handleYearChange } = usePhotoFetch(0);
  const { isAdmin, wantsAdmin } = useAdminMode();
  const { hiddenIds, hidePhoto, restorePhoto } = useHiddenPhotos();
  const { undatedIds, markAsUndated } = useUndatedPhotos();
  const [showHidden, setShowHidden] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Utloggad");
  };

  /** Delete all api_cache rows whose decade key contains the given year bucket */
  const invalidateCacheForYear = async (photoYear: number | null) => {
    // Invalidate both the decade the photo belonged to and the undated bucket
    const keys: string[] = ["4:0"]; // always invalidate undated
    if (photoYear != null) {
      const decade = Math.floor(photoYear / 10) * 10;
      keys.push(`4:${decade}`);
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
    <div className="flex h-screen w-screen flex-col" style={{ background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/images/brick-bg.jpg') center/600px fixed" }}>
      <header className="shrink-0 px-4 py-3">
         <div className="bg-black/85 backdrop-blur-md border border-white/20 px-4 py-3 sm:px-6">
             <h1 className="text-3xl font-medium text-white font-display uppercase tracking-wide">
               KTH i bilder
             </h1>
             <div className="flex items-center justify-between">
               <p className="text-[11px] sm:text-xs text-white/60 font-display mt-1 leading-relaxed">
                 Bilder hämtas från Alvin, Digitala Stadsmuseet, DigitaltMuseum, Europeana, K-samsök, Stockholmskällan och Wikimedia Commons
               </p>
                {wantsAdmin && !isAdmin && (
                  <div className="shrink-0 ml-3">
                    <button
                      onClick={() => setShowLogin(true)}
                      className="flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Logga in
                    </button>
                  </div>
                )}
                 {isAdmin && (
                   <div className="shrink-0 ml-3 flex items-center gap-2">
                     <button
                       onClick={() => setShowStats(true)}
                       className="flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                     >
                       <BarChart3 className="h-3.5 w-3.5" />
                       Statistik
                     </button>
                     <button
                       onClick={() => setShowHidden(true)}
                       className="flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                     >
                       <EyeOff className="h-3.5 w-3.5" />
                       Dolda ({hiddenIds.size})
                     </button>
                     <button
                       onClick={handleLogout}
                       className="flex items-center gap-1.5 rounded bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                     >
                       <LogOut className="h-3.5 w-3.5" />
                       Logga ut
                     </button>
                   </div>
                 )}
            </div>
            <div className="mt-4 border-t border-white/15 pt-4">
              <TimeSlider year={year} onChange={handleYearChange} />
            </div>
          </div>
      </header>

      <PhotoGallery results={visibleResults} year={year} loading={loading} isAdmin={isAdmin} onHidePhoto={handleHidePhoto} onMarkUndated={isAdmin ? handleMarkUndated : undefined} />

      <HiddenPhotosModal open={showHidden} onClose={() => setShowHidden(false)} onRestore={handleRestorePhoto} />
      <AdminStatsModal open={showStats} onClose={() => setShowStats(false)} />
      <AdminLoginModal open={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
};

export default Index;
