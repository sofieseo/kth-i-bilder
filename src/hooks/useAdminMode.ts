import { useMemo } from "react";

/** Returns true when ?admin=true is in the URL */
export function useAdminMode(): boolean {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "true";
  }, []);
}
