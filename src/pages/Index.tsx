import { useState, useCallback, useRef, useEffect } from "react";
import { TimeSlider } from "@/components/TimeSlider";
import { PhotoGallery } from "@/components/PhotoGallery";
import { fetchAllPhotosStreaming, type UnifiedPhoto } from "@/data/fetchAllPhotos";

const Index = () => {
  const [year, setYear] = useState(1920);
  const [results, setResults] = useState<UnifiedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const fetchIdRef = useRef(0);

  const fetchPhotos = useCallback((targetYear: number) => {
    setLoading(true);
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const currentFetchId = ++fetchIdRef.current;

    debounceRef.current = setTimeout(async () => {
      // If a newer fetch was started, abort this one
      if (currentFetchId !== fetchIdRef.current) return;

      try {
        await fetchAllPhotosStreaming(targetYear, (photos) => {
          if (currentFetchId !== fetchIdRef.current) return;
          setResults([...photos]);
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    }, 400);
  }, []);

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
    fetchPhotos(newYear);
  }, [fetchPhotos]);

  useEffect(() => {
    fetchPhotos(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col" style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/images/brick-bg.jpg') center/cover fixed" }}>
      <header className="shrink-0 px-4 py-3">
        <div className="inline-block bg-black/85 backdrop-blur-md border border-white/20 px-4 py-3">
          <h1 className="text-2xl font-bold text-white font-sans uppercase tracking-wide">
            Utforska KTH i bilder
          </h1>
          <p className="text-xs text-white/70 font-sans mt-0.5">
            Bilder från DigitaltMuseum, Europeana och K-samsök
          </p>
        </div>
      </header>

      <PhotoGallery results={results} year={year} loading={loading} />

      <TimeSlider year={year} onChange={handleYearChange} />
    </div>
  );
};

export default Index;
