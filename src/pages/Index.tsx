import { useMemo } from "react";
import { TimeSlider } from "@/components/TimeSlider";
import { PhotoGallery } from "@/components/PhotoGallery";
import { usePhotoFetch } from "@/hooks/usePhotoFetch";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useHiddenPhotos } from "@/hooks/useHiddenPhotos";

const Index = () => {
  const { year, results, loading, handleYearChange } = usePhotoFetch(1920);
  const isAdmin = useAdminMode();
  const { hiddenIds, hidePhoto } = useHiddenPhotos();

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

      <TimeSlider year={year} onChange={handleYearChange} />
    </div>
  );
};

export default Index;
