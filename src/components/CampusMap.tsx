import { useEffect, useRef } from "react";
import L from "leaflet";
import { hotspots } from "@/data/hotspots";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const KTH_CENTER: [number, number] = [59.3473, 18.0720];

function hotspotIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:hsl(36,90%,55%);opacity:0.3;animation:hotspot-ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:hsl(36,90%,55%);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

interface CampusMapProps {
  year: number;
}

export function CampusMap({ year }: CampusMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const yearRef = useRef(year);
  yearRef.current = year;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false }).setView(KTH_CENTER, 17);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const icon = hotspotIcon();

    hotspots.forEach((hs) => {
      const marker = L.marker([hs.lat, hs.lng], { icon }).addTo(map);
      marker.bindPopup(() => {
        const y = yearRef.current;
        const relevantFacts = hs.facts.filter((f) => f.year <= y);
        const fact = relevantFacts.length > 0 ? relevantFacts[relevantFacts.length - 1] : null;
        return `<div style="min-width:200px;max-width:260px;font-family:'Figtree',sans-serif;">
          <h3 style="font-family:'Playfair Display',serif;font-weight:700;font-size:14px;margin:0 0 6px;">${hs.name}</h3>
          ${fact
            ? `<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:hsl(36,90%,55%);">${fact.year}</span>
               <p style="font-size:12px;line-height:1.5;margin:4px 0 0;color:#333;">${fact.text}</p>`
            : `<p style="font-size:12px;font-style:italic;color:#888;">No records before ${y}.</p>`
          }
        </div>`;
      });
      markersRef.current.push(marker);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
