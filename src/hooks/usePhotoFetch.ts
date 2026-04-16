import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllPhotos, type UnifiedPhoto } from "@/data/fetchAllPhotos";
import { useDebounce } from "./useDebounce";

const DAY_MS = 24 * 60 * 60 * 1000;

function getYearFromUrl(fallback: number): number {
  const params = new URLSearchParams(window.location.search);
  const y = params.get("year");
  if (y !== null) {
    const n = parseInt(y, 10);
    if (!isNaN(n)) return n;
  }
  return fallback;
}

function setYearInUrl(year: number) {
  const url = new URL(window.location.href);
  if (year === 0) {
    url.searchParams.delete("year");
  } else {
    url.searchParams.set("year", String(year));
  }
  window.history.replaceState({}, "", url.toString());
}

const initialYear = getYearFromUrl(0);

export function usePhotoFetch(fallbackYear = 0) {
  const [year, setYear] = useState(initialYear);
  const debouncedYear = useDebounce(year, 500);

  useEffect(() => {
    setYearInUrl(year);
  }, [year]);

  const { data: results = [], isLoading } = useQuery<UnifiedPhoto[]>({
    queryKey: ["photos", debouncedYear],
    queryFn: () => fetchAllPhotos(debouncedYear),
    staleTime: DAY_MS,
    gcTime: DAY_MS,
  });

  // Show loading while debounce hasn't settled or query is fetching
  const loading = isLoading || year !== debouncedYear;

  return { year, results: loading ? [] : results, loading, handleYearChange: setYear };
}
