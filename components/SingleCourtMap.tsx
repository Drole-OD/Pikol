"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SingleCourtMapProps {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

const icon = new L.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#059669"/><circle cx="12" cy="12" r="4.5" fill="white"/></svg>`
    ),
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32],
});

export default function SingleCourtMap({
  lat,
  lng,
  name,
  address,
}: SingleCourtMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="w-full h-64 rounded-lg overflow-hidden"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon}>
        <Popup>
          <strong>{name}</strong>
          <br />
          {address}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
