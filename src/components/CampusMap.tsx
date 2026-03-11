import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { hotspots } from "@/data/hotspots";
import { HotspotPopup } from "./HotspotPopup";
import { renderToString } from "react-dom/server";

// Fix default icon
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

function createHotspotIcon() {
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
  const hotspotIcon = useRef(createHotspotIcon());

  return (
    <MapContainer
      center={KTH_CENTER}
      zoom={17}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotspots.map((hs) => (
        <Marker key={hs.id} position={[hs.lat, hs.lng]} icon={hotspotIcon.current}>
          <Popup>
            <HotspotPopup hotspot={hs} year={year} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
