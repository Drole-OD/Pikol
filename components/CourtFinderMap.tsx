"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CourtWithMeta {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  numberOfCourts: number;
  surfaceType: string;
  isOpen: boolean;
  availableSlots: number;
  distance: number | null;
}

interface CourtFinderMapProps {
  courts: CourtWithMeta[];
  onSelectCourt: (id: string) => void;
  center: [number, number];
  zoom?: number;
}

// Bounding box around the Philippines (with a little padding), used to
// keep the map focused on the country and stop users panning away from it.
const PHILIPPINES_BOUNDS: [[number, number], [number, number]] = [
  [3, 114],
  [22, 129],
];

const courtIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#059669"/><circle cx="12" cy="12" r="4.5" fill="white"/></svg>`
    ),
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32],
});

const closedIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#9ca3af"/><circle cx="12" cy="12" r="4.5" fill="white"/></svg>`
    ),
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32],
});

export default function CourtFinderMap({
  courts,
  onSelectCourt,
  center,
  zoom = 12,
}: CourtFinderMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={5}
      maxBounds={PHILIPPINES_BOUNDS}
      maxBoundsViscosity={1.0}
      className="w-full h-[400px] rounded-xl z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {courts.map((court) => (
        <Marker
          key={court.id}
          position={[court.lat, court.lng]}
          icon={court.isOpen ? courtIcon : closedIcon}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-semibold text-sm mb-1">{court.name}</h3>
              <p className="text-xs text-gray-600 mb-1">{court.address}</p>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    court.isOpen
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {court.isOpen ? "Open" : "Closed"}
                </span>
                <span className="text-xs text-gray-500">
                  {court.availableSlots} slots available
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span>
                  {court.numberOfCourts} courts · {court.surfaceType}
                </span>
                {court.distance !== null && (
                  <span>· {court.distance} mi</span>
                )}
              </div>
              <button
                onClick={() => onSelectCourt(court.id)}
                className="w-full text-center text-xs font-medium px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
