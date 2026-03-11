import { MapPin, Info } from "lucide-react";
import type { Hotspot } from "@/data/hotspots";

interface HotspotPopupProps {
  hotspot: Hotspot;
  year: number;
}

export function HotspotPopup({ hotspot, year }: HotspotPopupProps) {
  const relevantFacts = hotspot.facts.filter((f) => f.year <= year);
  const closestFact = relevantFacts.length > 0 ? relevantFacts[relevantFacts.length - 1] : null;

  return (
    <div className="min-w-[200px] max-w-[260px]">
      <div className="flex items-center gap-1.5 mb-1">
        <MapPin className="h-3.5 w-3.5 text-primary" style={{ color: "hsl(210,78%,46%)" }} />
        <h3 className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
          {hotspot.name}
        </h3>
      </div>
      {closestFact ? (
        <div className="mt-1">
          <div className="flex items-center gap-1 mb-0.5">
            <Info className="h-3 w-3" style={{ color: "hsl(36,90%,55%)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(36,90%,55%)" }}>
              {closestFact.year}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#333" }}>{closestFact.text}</p>
        </div>
      ) : (
        <p className="text-xs italic" style={{ color: "#888" }}>No records before {year}.</p>
      )}
    </div>
  );
}
