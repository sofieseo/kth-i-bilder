import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllPhotos, type UnifiedPhoto } from "@/data/fetchAllPhotos";
import { useDebounce } from "./useDebounce";

const DAY_MS = 24 * 60 * 60 * 1000;

export function usePhotoFetch(initialYear = 1920) {
  const [year, setYear] = useState(initialYear);
  const debouncedYear = useDebounce(year, 500);

  const { data: results = [], isLoading: loading } = useQuery<UnifiedPhoto[]>({
    queryKey: ["photos", debouncedYear],
    queryFn: () => fetchAllPhotos(debouncedYear),
    staleTime: DAY_MS,
    gcTime: DAY_MS,
  });

  return { year, results, loading, handleYearChange: setYear };
}
