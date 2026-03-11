import { useState, useCallback, useRef, useEffect } from "react";
import { TimeSlider } from "@/components/TimeSlider";
import { PhotoGallery } from "@/components/PhotoGallery";
import { fetchAllPhotosStreaming, type UnifiedPhoto } from "@/data/fetchAllPhotos";

const Index = () => {
  const [year, setYear] = useState(1920);
  const [results, setResults] = useState<UnifiedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPhotos = useCallback((targetYear: number) => {
    setLoading(true);
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await fetchAllPhotosStreaming(targetYear, (photos) => {
          setResults([...photos]);
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
    fetchPhotos(newYear);
  }, [fetchPhotos]);

  // Load initial results
  useEffect(() => {
    fetchPhotos(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col" style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/images/brick-bg.jpg') center/cover fixed" }}>
      {/* Header */}
      <header className="shrink-0 border-b border-border px-4 py-3">
        <h1 className="text-3xl font-extrabold text-primary-foreground">KTH 200 år</h1>
        <p className="text-sm font-bold text-primary-foreground">Utforska KTH i bilder</p>
      </header>

      {/* Gallery */}
      <PhotoGallery results={results} year={year} loading={loading} />

      {/* Time slider */}
      <TimeSlider year={year} onChange={handleYearChange} />
    </div>
  );
};

export default Index;
