import { useEffect, useRef } from "react";
import L from "leaflet";

const KTH_CENTER: [number, number] = [59.3473, 18.0720];

export function CampusMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false }).setView(KTH_CENTER, 17);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const resizeMap = () => map.invalidateSize();
    const timer1 = window.setTimeout(resizeMap, 0);
    const timer2 = window.setTimeout(resizeMap, 200);
    const timer3 = window.setTimeout(resizeMap, 600);

    window.addEventListener("resize", resizeMap);

    return () => {
      window.removeEventListener("resize", resizeMap);
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
