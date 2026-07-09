"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import CourtCard from "@/components/CourtCard";
import CourtDetailPanel from "@/components/CourtDetailPanel";
import { SearchIcon, LocateIcon } from "@/components/icons";

const CourtFinderMap = dynamic(
  () => import("@/components/CourtFinderMap"),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-xl animate-pulse" /> }
);

interface CourtWithMeta {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  numberOfCourts: number;
  surfaceType: string;
  amenities: string[];
  isOpen: boolean;
  availableSlots: number;
  distance: number | null;
}

interface CourtFinderViewProps {
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
  onBookingComplete?: () => void;
}

const AMENITY_OPTIONS = [
  { value: "lights", label: "Lights" },
  { value: "restrooms", label: "Restrooms" },
  { value: "parking", label: "Parking" },
  { value: "pro-shop", label: "Pro Shop" },
  { value: "snack-bar", label: "Snack Bar" },
];

export default function CourtFinderView({
  isAuthenticated,
  userId,
  userName,
  onBookingComplete,
}: CourtFinderViewProps) {
  const today = new Date().toISOString().split("T")[0];
  const [courts, setCourts] = useState<CourtWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "list">("map");
  const [search, setSearch] = useState("");
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [surfaceFilter, setSurfaceFilter] = useState<string>("");
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  const defaultCenter: [number, number] = [12.8797, 121.774]; // Philippines

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ date: today });
    if (userLocation) {
      params.set("lat", String(userLocation.lat));
      params.set("lng", String(userLocation.lng));
    }
    if (openNowFilter) params.set("openNow", "true");
    if (amenityFilters.length > 0)
      params.set("amenities", amenityFilters.join(","));

    const res = await fetch(`/api/courts?${params}`);
    const data = await res.json();
    setCourts(data);
    setLoading(false);
  }, [today, userLocation, openNowFilter, amenityFilters]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const requestLocation = () => {
    setLocationRequested(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setLocationRequested(false);
        }
      );
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenityFilters((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const filteredCourts = courts.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.name.toLowerCase().includes(q) &&
        !c.address.toLowerCase().includes(q)
      )
        return false;
    }
    if (
      surfaceFilter &&
      c.surfaceType !== surfaceFilter &&
      c.surfaceType !== "mixed"
    )
      return false;
    return true;
  });

  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter;
  const mapZoom = userLocation ? 12 : 6;

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courts by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          {!userLocation && (
            <button
              onClick={requestLocation}
              disabled={locationRequested}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm hover:border-gray-300 transition-colors disabled:opacity-50"
              title="Use my location to sort by distance"
            >
              <LocateIcon className="w-4 h-4" />
              Near Me
            </button>
          )}
          {userLocation && (
            <span className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
              <LocateIcon className="w-4 h-4" />
              Nearby
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                view === "map"
                  ? "bg-white text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                view === "list"
                  ? "bg-white text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              List
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Open now */}
          <button
            onClick={() => setOpenNowFilter(!openNowFilter)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              openNowFilter
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            Open Now
          </button>

          {/* Surface type */}
          <select
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-gray-600 border border-gray-200 hover:border-gray-300 cursor-pointer"
          >
            <option value="">All Surfaces</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>

          {/* Amenities */}
          {AMENITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleAmenity(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                amenityFilters.includes(opt.value)
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filteredCourts.length} court{filteredCourts.length !== 1 ? "s" : ""}{" "}
          found
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {view === "map" && (
            <CourtFinderMap
              courts={filteredCourts}
              onSelectCourt={setSelectedCourtId}
              center={mapCenter}
              zoom={mapZoom}
            />
          )}

          {/* List always shows below map, or as main view */}
          <div
            className={`grid gap-3 ${
              view === "list"
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {filteredCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                onSelect={setSelectedCourtId}
              />
            ))}
          </div>

          {filteredCourts.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                No courts found
              </h3>
              <p className="text-gray-500 text-sm">
                Try adjusting your filters or search term.
              </p>
            </div>
          )}
        </>
      )}

      {/* Court Detail Panel */}
      {selectedCourtId && (
        <CourtDetailPanel
          courtId={selectedCourtId}
          onClose={() => setSelectedCourtId(null)}
          isAuthenticated={isAuthenticated}
          userId={userId}
          userName={userName}
          onBookingComplete={onBookingComplete}
        />
      )}
    </div>
  );
}
