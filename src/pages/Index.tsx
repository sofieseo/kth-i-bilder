import { useMemo, useState } from "react";
import { TimeSlider } from "@/components/TimeSlider";
import { PhotoGallery } from "@/components/PhotoGallery";
import { HiddenPhotosModal } from "@/components/HiddenPhotosModal";
import { usePhotoFetch } from "@/hooks/usePhotoFetch";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useHiddenPhotos } from "@/hooks/useHiddenPhotos";

const Index = () => {
  const { year, results, loading, handleYearChange } = usePhotoFetch(1920);
  const isAdmin = useAdminMode();
  const { hiddenIds, hidePhoto, restorePhoto } = useHiddenPhotos();
  const [showHidden, setShowHidden] = useState(false);

  const visibleResults = useMemo(
    () => results.filter((p) => !hiddenIds.has(p.id)),
    [results, hiddenIds],
  );

  return (
    <div className="flex h-screen w-screen flex-col" style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/images/brick-bg.jpg') center/600px fixed" }}>
      <header className="shrink-0 px-4 py-3">
        <div className="inline-block bg-black/85 backdrop-blur-md border border-white/20 px-4 py-3">
          <h1 className="text-2xl font-bold text-white font-sans uppercase tracking-wide">
            Utforska KTH i bilder
          </h1>
          <p className="text-xs text-white/70 font-sans mt-0.5">
            Bilder från DigitaltMuseum, Europeana, K-samsök, Stockholmskällan och Wikimedia Commons
          </p>
        </div>
      </header>

      <PhotoGallery results={visibleResults} year={year} loading={loading} isAdmin={isAdmin} onHidePhoto={hidePhoto} />

      {isAdmin && (
        <div className="fixed bottom-8 right-4 z-20">
          <button
            onClick={() => setShowHidden(true)}
            className="rounded bg-white/10 border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 backdrop-blur-sm transition-colors"
          >
            Visa dolda API-bilder ({hiddenIds.size})
          </button>
        </div>
      )}

      <TimeSlider year={year} onChange={handleYearChange} />

      <HiddenPhotosModal open={showHidden} onClose={() => setShowHidden(false)} onRestore={restorePhoto} />
    </div>
  );
};

export default Index;
