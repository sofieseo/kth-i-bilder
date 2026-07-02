import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget anonymous event tracking.
 * Errors are swallowed so tracking never breaks the UI.
 */
export type AnalyticsEventType =
  | "tab_change"
  | "photo_open"
  | "search";

export function trackEvent(
  event_type: AnalyticsEventType,
  event_data: Record<string, unknown> = {}
): void {
  try {
    void supabase.from("analytics_events").insert([{ event_type, event_data: event_data as any }]);
  } catch {
    // ignore
  }
}
