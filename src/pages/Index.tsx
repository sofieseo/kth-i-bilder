import { useState, useCallback, useRef, useEffect } from "react";
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
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchPhotos = useCallback((targetYear: number, query?: string) => {
    setLoading(true);
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await fetchAllPhotosStreaming(targetYear, (photos) => {
          setResults([...photos]);
        }, query || undefined);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
    fetchPhotos(newYear, searchQuery);
  }, [fetchPhotos, searchQuery]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchPhotos(year, value);
    }, 600);
  }, [fetchPhotos, year]);

  // Load initial results
  useEffect(() => {
    fetchPhotos(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col" style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/images/brick-bg.jpg') center/cover fixed" }}>
      {/* Header */}
      <header className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary-foreground font-sans">
          Utforska KTH i bilder
        </h1>
        <div className="relative shrink-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Sök bland bilder..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 w-40 rounded-none border border-border bg-background/80 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </header>

      {/* Gallery */}
      <PhotoGallery results={results} year={year} loading={loading} />

      {/* Time slider */}
      <TimeSlider year={year} onChange={handleYearChange} />
    </div>
  );
};

export default Index;
