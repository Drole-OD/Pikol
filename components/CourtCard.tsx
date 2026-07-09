"use client";

const AMENITY_LABELS: Record<string, string> = {
  lights: "Lights",
  restrooms: "Restrooms",
  water: "Water",
  parking: "Parking",
  "pro-shop": "Pro Shop",
  "snack-bar": "Snack Bar",
  lockers: "Lockers",
};

const SURFACE_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  mixed: "Indoor & Outdoor",
};

interface CourtCardProps {
  court: {
    id: string;
    name: string;
    address: string;
    numberOfCourts: number;
    surfaceType: string;
    amenities: string[];
    isOpen: boolean;
    availableSlots: number;
    distance: number | null;
  };
  onSelect: (id: string) => void;
}

export default function CourtCard({ court, onSelect }: CourtCardProps) {
  return (
    <button
      onClick={() => onSelect(court.id)}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {court.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">{court.address}</p>
        </div>
        <span
          className={`ml-2 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
            court.isOpen
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {court.isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>{SURFACE_LABELS[court.surfaceType] ?? court.surfaceType}</span>
        <span>·</span>
        <span>{court.numberOfCourts} courts</span>
        {court.distance !== null && (
          <>
            <span>·</span>
            <span>{court.distance} mi away</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400 truncate">
          {court.amenities.slice(0, 3).map((a) => AMENITY_LABELS[a] || a).join(" · ")}
          {court.amenities.length > 3 && ` +${court.amenities.length - 3}`}
        </p>
        <span
          className={`shrink-0 text-xs font-medium ${
            court.availableSlots > 0 ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          {court.availableSlots > 0
            ? `${court.availableSlots} slots open`
            : "No slots today"}
        </span>
      </div>
    </button>
  );
}
