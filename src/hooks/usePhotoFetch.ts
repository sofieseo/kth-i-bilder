import { useState, useCallback, useRef, useEffect } from "react";
import { fetchAllPhotosStreaming, type UnifiedPhoto } from "@/data/fetchAllPhotos";

export function usePhotoFetch(initialYear = 1920) {
  const [year, setYear] = useState(initialYear);
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

  return { year, results, loading, handleYearChange };
}
