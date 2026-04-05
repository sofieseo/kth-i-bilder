import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns:
 * - isAdmin: true when ?admin=true AND user is authenticated
 * - wantsAdmin: true when ?admin=true (used to show login prompt)
 * - adminLoading: true while checking auth state
 */
export function useAdminMode() {
  const wantsAdmin = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "true";
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading] = useState(wantsAdmin);

  useEffect(() => {
    if (!wantsAdmin) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAdminLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAdminLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [wantsAdmin]);

  return {
    isAdmin: wantsAdmin && isAuthenticated,
    wantsAdmin,
    adminLoading,
  };
}
