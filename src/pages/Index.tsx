import { useState, useCallback, useRef } from "react";
import { PanelRightOpen } from "lucide-react";
import { CampusMap } from "@/components/CampusMap";
import { TimeSlider } from "@/components/TimeSlider";
import { SidePanel } from "@/components/SidePanel";
import { fetchAllPhotos, type UnifiedPhoto } from "@/data/fetchAllPhotos";

const Index = () => {
  const [year, setYear] = useState(1917);
  const [panelOpen, setPanelOpen] = useState(false);
  const [results, setResults] = useState<UnifiedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear);
    setPanelOpen(true);
    setLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchAllPhotos(newYear);
        setResults(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 600);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <CampusMap />

      <div className="fixed left-4 top-4 z-[1000] flex items-center gap-3">
        <div className="panel-glass border border-border px-4 py-2 shadow-lg">
          <h1 className="text-lg font-bold text-foreground">KTH 200 år</h1>
          <p className="text-[10px] text-muted-foreground">Utforska Campus historia</p>
        </div>
      </div>

      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="fixed right-4 top-4 z-[1000] panel-glass border border-border p-2.5 shadow-lg text-foreground hover:bg-muted transition-colors"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}

      <SidePanel open={panelOpen} onClose={() => setPanelOpen(false)} results={results} year={year} loading={loading} />
      <TimeSlider year={year} onChange={handleYearChange} />
    </div>
  );
};

export default Index;
