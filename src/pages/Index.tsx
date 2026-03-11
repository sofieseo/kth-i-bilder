import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { TimeSlider } from "@/components/TimeSlider";
import { PhotoGallery } from "@/components/PhotoGallery";
import { fetchAllPhotosStreaming, type UnifiedPhoto } from "@/data/fetchAllPhotos";
import { Search } from "lucide-react";

const Index = () => {
  const [year, setYear] = useState(1920);
  const [results, setResults] = useState<UnifiedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter((photo) =>
      [photo.title, photo.description, photo.place, ...photo.subjects]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [results, searchQuery]);

  return (
    <div className="flex h-screen w-screen flex-col" style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/images/brick-bg.jpg') center/cover fixed" }}>
      {/* Header */}
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Sök bland bilder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-44 rounded-md border border-border bg-background/80 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <h1 className="text-3xl font-bold text-primary-foreground" style={{ fontFamily: "'Caveat', cursive" }}>
          Utforska KTH i bilder
        </h1>
      </header>

      {/* Gallery */}
      <PhotoGallery results={filteredResults} year={year} loading={loading} />

      {/* Time slider */}
      <TimeSlider year={year} onChange={handleYearChange} />
    </div>
  );
};

export default Index;
