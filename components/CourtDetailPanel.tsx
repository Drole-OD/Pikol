"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  CheckIcon,
  MapPinIcon,
  PhoneIcon,
  CompassIcon,
  CameraIcon,
} from "@/components/icons";

const SingleCourtMap = dynamic(() => import("@/components/SingleCourtMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse" />
  ),
});

interface SlotInfo {
  start: string;
  end: string;
  available: boolean;
  availableCourts?: number;
  bookedBy: string | null;
}

interface CourtUnit {
  id: string;
  number: number;
  name: string | null;
  isActive: boolean;
  surfaceType: "indoor" | "outdoor";
}

const SURFACE_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  mixed: "Indoor & Outdoor",
};

interface CourtDetail {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  numberOfCourts: number;
  surfaceType: string;
  amenities: string[];
  operatingHours: Record<
    string,
    { open: string; close: string; closed?: boolean }
  >;
  images: string[];
  units: CourtUnit[];
  slots: SlotInfo[];
  hoursToday: { open: string; close: string; closed?: boolean };
}

const AMENITY_LABELS: Record<string, string> = {
  lights: "Lights",
  restrooms: "Restrooms",
  water: "Water",
  parking: "Parking",
  "pro-shop": "Pro Shop",
  "snack-bar": "Snack Bar",
  lockers: "Lockers",
};

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

function formatTime(t: string) {
  const [h] = t.split(":");
  const hour = parseInt(h) % 24;
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:00 ${ampm}`;
}

interface CourtDetailPanelProps {
  courtId: string;
  onClose: () => void;
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
  onBookingComplete?: () => void;
}

export default function CourtDetailPanel({
  courtId,
  onClose,
  isAuthenticated,
  userId,
  userName,
  onBookingComplete,
}: CourtDetailPanelProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourtNumber, setSelectedCourtNumber] = useState<number | null>(null);
  const [bookingSlot, setBookingSlot] = useState<SlotInfo | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const fetchCourt = useCallback(async () => {
    setLoading(true);
    const url = selectedCourtNumber
      ? `/api/courts/${courtId}?date=${date}&courtNumber=${selectedCourtNumber}`
      : `/api/courts/${courtId}?date=${date}`;
    const res = await fetch(url);
    const data = await res.json();
    setCourt(data);
    setLoading(false);
  }, [courtId, date, selectedCourtNumber]);

  useEffect(() => {
    fetchCourt();
  }, [fetchCourt]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    if (viewerIndex === null || !court) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIndex(null);
      if (e.key === "ArrowRight")
        setViewerIndex((i) => (i === null ? i : (i + 1) % court.images.length));
      if (e.key === "ArrowLeft")
        setViewerIndex((i) =>
          i === null ? i : (i - 1 + court.images.length) % court.images.length
        );
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerIndex, court]);

  const handleBook = async () => {
    if (!bookingSlot || !userName?.trim()) return;
    setBookingInProgress(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courtId,
        courtNumber: selectedCourtNumber,
        date,
        startTime: bookingSlot.start,
        endTime: bookingSlot.end,
        playerName: userName.trim(),
        userId,
      }),
    });
    if (res.ok) {
      setBookingSuccess(
        `${selectedUnitLabel} · ${formatTime(bookingSlot.start)} – ${formatTime(bookingSlot.end)}`
      );
      setBookingSlot(null);
      fetchCourt();
      onBookingComplete?.();
    }
    setBookingInProgress(false);
  };

  const buildCalendar = () => {
    const { year, month } = calendarMonth;
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push(iso);
    }
    return cells;
  };

  const shiftMonth = (delta: number) => {
    setCalendarMonth((cm) => {
      const d = new Date(cm.year, cm.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const calendarCells = buildCalendar();
  const monthLabel = new Date(
    calendarMonth.year,
    calendarMonth.month,
    1
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const isModalOpen =
    (selectedCourtNumber !== null || bookingSlot !== null) && isAuthenticated;

  if (loading || !court) {
    return (
      <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 rounded w-1/3" />
            <div className="h-64 bg-gray-100 rounded-lg" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${court.lat},${court.lng}`;
  const availableCount = court.slots.filter((s) => s.available).length;
  const selectedUnit = court.units.find(
    (u) => u.number === selectedCourtNumber
  );
  const selectedUnitLabel =
    selectedUnit?.name || `Court ${selectedCourtNumber}`;

  return (
    <div
      className={`fixed inset-0 bg-white z-40 ${isModalOpen ? "overflow-hidden" : "overflow-y-auto"}`}
    >
      {/* Sticky top bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-700"
            aria-label="Back"
          >
            <ArrowLeftIcon />
          </button>
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {court.name}
          </h2>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Picture gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-64 sm:h-80">
          {court.images[0] ? (
            <button
              onClick={() => setViewerIndex(0)}
              className="col-span-4 sm:col-span-2 row-span-2 rounded-lg overflow-hidden cursor-zoom-in"
            >
              <img
                src={court.images[0]}
                alt={court.name}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <div className="col-span-4 sm:col-span-2 row-span-2 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
              <CameraIcon className="w-12 h-12" />
            </div>
          )}
          {[1, 2, 3].map((i) =>
            court.images[i] ? (
              <button
                key={i}
                onClick={() => setViewerIndex(i)}
                className={`relative hidden sm:block col-span-1 rounded-lg overflow-hidden cursor-zoom-in ${
                  i === 3 ? "col-span-2" : ""
                }`}
              >
                <img
                  src={court.images[i]}
                  alt={`${court.name} photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {i === 3 && court.images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium text-sm">
                    +{court.images.length - 4} more
                  </div>
                )}
              </button>
            ) : (
              <div
                key={i}
                className={`hidden sm:flex col-span-1 rounded-lg bg-gray-50 items-center justify-center text-gray-300 ${
                  i === 3 ? "col-span-2" : ""
                }`}
              >
                <CameraIcon className="w-6 h-6" />
              </div>
            )
          )}
        </div>

        <div className="space-y-6">
          {/* Booking success toast */}
          {bookingSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Booked!
                  </p>
                  <p className="text-xs text-emerald-600">
                    {bookingSuccess} on{" "}
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookingSuccess(null)}
                className="text-emerald-400 hover:text-emerald-600"
                aria-label="Dismiss"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Info */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0" />
              {court.address}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
              {court.phone}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>{SURFACE_LABELS[court.surfaceType] ?? court.surfaceType}</span>
              <span>·</span>
              <span>{court.numberOfCourts} courts</span>
            </div>
          </div>

          {/* Directions */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:border-gray-400 transition-colors text-sm"
          >
            <CompassIcon className="w-4 h-4" />
            Get Directions
          </a>

          {/* Map */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Location
            </h3>
            <div className="isolate relative z-0">
              <SingleCourtMap
                lat={court.lat}
                lng={court.lng}
                name={court.name}
                address={court.address}
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {court.amenities.map((a) => (
                <span
                  key={a}
                  className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                >
                  {AMENITY_LABELS[a] || a}
                </span>
              ))}
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Operating Hours
            </h3>
            <div className="border border-gray-200 rounded-lg p-3 space-y-1">
              {(
                ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
              ).map((day) => {
                const hours = court.operatingHours[day];
                const todayDay =
                  ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
                    new Date().getDay()
                  ];
                return (
                  <div
                    key={day}
                    className={`flex justify-between text-xs px-2 py-1 rounded ${
                      day === todayDay
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    <span>{DAY_LABELS[day]}</span>
                    <span
                      className={hours.closed ? "text-gray-400" : undefined}
                    >
                      {hours.closed
                        ? "Closed"
                        : `${formatTime(hours.open)} – ${formatTime(hours.close)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courts list */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Courts
            </h3>
            {!isAuthenticated && (
              <p className="text-xs text-gray-400 mb-2">
                Sign in to book a court
              </p>
            )}
            {court.units.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6 border border-gray-200 rounded-lg">
                No courts available yet
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {court.units.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => {
                      if (!isAuthenticated) return;
                      setSelectedCourtNumber(unit.number);
                      setBookingSlot(null);
                    }}
                    disabled={!isAuthenticated}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left bg-white ${
                      isAuthenticated
                        ? "border-gray-200 hover:border-gray-300 cursor-pointer"
                        : "border-gray-200 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="w-12 h-12 shrink-0 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-sm">
                      {unit.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {unit.name || `Court ${unit.number}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {SURFACE_LABELS[unit.surfaceType] ?? unit.surfaceType}
                      </p>
                    </div>
                    <span className="text-emerald-600 text-xs font-medium pr-2">
                      Book
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking selector modal — calendar + live time slots */}
      {selectedCourtNumber && isAuthenticated && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCourtNumber(null)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Book {selectedUnitLabel}
              </h3>
              <button
                onClick={() => setSelectedCourtNumber(null)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Calendar */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => shiftMonth(-1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
                    aria-label="Previous month"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-semibold text-gray-800">
                    {monthLabel}
                  </p>
                  <button
                    onClick={() => shiftMonth(1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
                    aria-label="Next month"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400 mb-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((iso, i) => {
                    if (!iso) return <div key={i} />;
                    const dayNum = parseInt(iso.split("-")[2]);
                    const isPast = iso < today;
                    const isSelected = iso === date;
                    const isToday = iso === today;
                    return (
                      <button
                        key={i}
                        disabled={isPast}
                        onClick={() => {
                          setDate(iso);
                          setBookingSlot(null);
                          setBookingSuccess(null);
                        }}
                        className={`aspect-square text-xs rounded-md font-medium transition-colors ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : isPast
                              ? "text-gray-300 cursor-not-allowed"
                              : isToday
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live availability */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">
                    {loading ? (
                      "Loading availability..."
                    ) : court.hoursToday.closed ? (
                      "Closed on this day"
                    ) : (
                      <>
                        <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1" />
                        {availableCount} of {court.slots.length} available on{" "}
                        {new Date(date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </>
                    )}
                  </p>
                </div>
                {court.hoursToday.closed ? (
                  <p className="text-xs text-gray-400 text-center py-4 border border-gray-200 rounded-lg">
                    This court is closed on the selected day.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {court.slots.map((slot) => (
                      <button
                        key={slot.start}
                        disabled={!slot.available}
                        onClick={() => {
                          if (slot.available) setBookingSlot(slot);
                        }}
                        className={`text-xs py-2 px-3 rounded-md font-medium transition-colors ${
                          slot.available
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed line-through"
                        }`}
                        title={
                          slot.bookedBy
                            ? `Booked by ${slot.bookedBy}`
                            : "Available"
                        }
                      >
                        {formatTime(slot.start)} – {formatTime(slot.end)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking confirmation modal */}
      {bookingSlot && isAuthenticated && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => !bookingInProgress && setBookingSlot(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-sm border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Booking
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Book this slot under your name?
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Player</span>
                <span className="font-semibold text-gray-900">{userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Court</span>
                <span className="font-semibold text-gray-900">
                  {court.name} · {selectedUnitLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-900">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-semibold text-gray-900">
                  {formatTime(bookingSlot.start)} – {formatTime(bookingSlot.end)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setBookingSlot(null)}
                disabled={bookingInProgress}
                className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={bookingInProgress}
                className="flex-1 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                {bookingInProgress ? "Booking..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {viewerIndex !== null && court.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"
          onClick={() => setViewerIndex(null)}
        >
          <button
            onClick={() => setViewerIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>

          {court.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerIndex((i) =>
                    i === null
                      ? null
                      : (i - 1 + court.images.length) % court.images.length
                  );
                }}
                className="absolute left-2 sm:left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
                aria-label="Previous photo"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerIndex((i) =>
                    i === null ? null : (i + 1) % court.images.length
                  );
                }}
                className="absolute right-2 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
                aria-label="Next photo"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            src={court.images[viewerIndex]}
            alt={`${court.name} photo ${viewerIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />

          {court.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {viewerIndex + 1} / {court.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
