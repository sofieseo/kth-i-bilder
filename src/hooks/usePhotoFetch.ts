import { useState, useEffect, useCallback } from "react";
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

export function usePhotoFetch(initialYear = 1920) {
  const [year, setYear] = useState(() => getYearFromUrl(initialYear));
  const debouncedYear = useDebounce(year, 500);

  // Sync URL when year changes
  useEffect(() => {
    setYearInUrl(year);
  }, [year]);

  const { data: results = [], isLoading: loading } = useQuery<UnifiedPhoto[]>({
    queryKey: ["photos", debouncedYear],
    queryFn: () => fetchAllPhotos(debouncedYear),
    staleTime: DAY_MS,
    gcTime: DAY_MS,
  });

  return { year, results, loading, handleYearChange: setYear };
}
