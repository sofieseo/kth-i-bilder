import { X, Search, Loader2 } from "lucide-react";
import { HistoryCard } from "./HistoryCard";
import type { HistoryResult } from "@/data/mockResults";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  results: HistoryResult[];
  year: number;
  loading: boolean;
}

export function SidePanel({ open, onClose, results, year, loading }: SidePanelProps) {
  return (
    <div
      className={`fixed right-0 top-0 z-[1000] flex h-full w-80 flex-col panel-glass border-l border-border shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-bold text-foreground">
            Records · {year}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="mt-2 text-xs">Searching archives…</span>
          </div>
        ) : results.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Move the time slider to search historical records.
          </p>
        ) : (
          results.map((r) => <HistoryCard key={r.id} result={r} />)
        )}
      </div>
    </div>
  );
}
