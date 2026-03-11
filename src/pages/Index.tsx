import { useState, useEffect, useCallback, useRef } from "react";
import { PanelRightOpen } from "lucide-react";
import { CampusMap } from "@/components/CampusMap";
import { TimeSlider } from "@/components/TimeSlider";
import { SidePanel } from "@/components/SidePanel";
import { fetchMockResults, type HistoryResult } from "@/data/mockResults";

const Index = () => {
  const [year, setYear] = useState(1917);
  const [panelOpen, setPanelOpen] = useState(false);
  const [results, setResults] = useState<HistoryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
    setPanelOpen(true);
    setLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = await fetchMockResults(newYear);
      setResults(data);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map */}
      <CampusMap year={year} />

      {/* Top bar */}
      <div className="fixed left-4 top-4 z-[1000] flex items-center gap-3">
        <div className="panel-glass rounded-xl border border-border px-4 py-2 shadow-lg">
          <h1 className="font-display text-lg font-bold text-foreground">
            KTH Campus · Tidslinje
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Explore 200 years of history on Valhallavägen
          </p>
        </div>
      </div>

      {/* Panel toggle */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="fixed right-4 top-4 z-[1000] rounded-xl panel-glass border border-border p-2.5 shadow-lg text-foreground hover:bg-muted transition-colors"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}

      {/* Side panel */}
      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        results={results}
        year={year}
        loading={loading}
      />

      {/* Time slider */}
      <TimeSlider year={year} onChange={handleYearChange} />
    </div>
  );
};

export default Index;
