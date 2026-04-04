import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DAY_COLORS = [
  "#e85d04", // Lun - orange
  "#2563eb", // Mar - blue
  "#16a34a", // Mer - green
  "#7c3aed", // Jeu - purple
  "#eab308", // Ven - yellow
  "#dc2626", // Sam - red
  "#0891b2", // Dim - teal
];

function createColorIcon(color: string, label: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:28px;height:28px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:12px;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createHomeIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:hsl(175,100%,32%);
      width:34px;height:34px;border-radius:10px;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:18px;
      border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.35);
    ">🏠</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  dayIndex: number;
  orderInDay: number;
  clientName: string;
  interventionType: string;
  travelFromPrev: number;
}

export interface HomePoint {
  lat: number;
  lng: number;
}

interface RoutesByDay {
  dayIndex: number;
  points: { lat: number; lng: number }[];
}

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (points.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      fitted.current = true;
    }
  }, [points, map]);

  return null;
}

interface FranceMapProps {
  homePoint: HomePoint | null;
  mapPoints: MapPoint[];
  routesByDay: RoutesByDay[];
  showRoutes: boolean;
}

export default function FranceMap({ homePoint, mapPoints, routesByDay, showRoutes }: FranceMapProps) {
  const allPoints = [
    ...(homePoint ? [homePoint] : []),
    ...mapPoints.map(p => ({ lat: p.lat, lng: p.lng })),
  ];

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length, allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length]
    : [46.6, 2.3]; // Centre de la France

  return (
    <MapContainer
      center={center}
      zoom={6}
      className="w-full h-full rounded-2xl"
      style={{ minHeight: 420, zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={allPoints} />

      {homePoint && (
        <Marker position={[homePoint.lat, homePoint.lng]} icon={createHomeIcon()}>
          <Popup><strong>🏠 Domicile technicien</strong></Popup>
        </Marker>
      )}

      {mapPoints.map((pt, idx) => (
        <Marker
          key={idx}
          position={[pt.lat, pt.lng]}
          icon={createColorIcon(DAY_COLORS[pt.dayIndex], String(pt.orderInDay + 1))}
        >
          <Popup>
            <div className="text-sm">
              <strong>{pt.clientName}</strong>
              <br />
              <span className="text-muted-foreground">{pt.interventionType}</span>
              {pt.travelFromPrev > 0 && (
                <>
                  <br />
                  <span>🚗 {pt.travelFromPrev} min depuis précédent</span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {showRoutes && routesByDay.map((route) => (
        <Polyline
          key={route.dayIndex}
          positions={route.points.map(p => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: DAY_COLORS[route.dayIndex],
            weight: 3,
            opacity: 0.8,
            dashArray: "8,6",
          }}
        />
      ))}
    </MapContainer>
  );
}
