"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArrowLeftIcon, XIcon, CameraIcon, LocateIcon } from "@/components/icons";

interface DayHours {
  open: string;
  close: string;
}

interface OperatingHours {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  surface_type: "indoor" | "outdoor" | "mixed";
  amenities: string[];
  operating_hours: OperatingHours;
  images: string[];
  number_of_courts: number;
}

interface CourtUnit {
  id: string;
  court_id: string;
  number: number;
  name: string | null;
  is_active: boolean;
  surface_type: "indoor" | "outdoor" | null;
}

const SURFACE_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  mixed: "Indoor & Outdoor",
};

const DAY_KEYS: (keyof OperatingHours)[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

const DAY_LABELS: Record<keyof OperatingHours, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const AMENITY_OPTIONS: { value: string; label: string }[] = [
  { value: "lights", label: "Lights" },
  { value: "restrooms", label: "Restrooms" },
  { value: "water", label: "Water" },
  { value: "parking", label: "Parking" },
  { value: "pro-shop", label: "Pro Shop" },
  { value: "snack-bar", label: "Snack Bar" },
  { value: "lockers", label: "Lockers" },
];

function defaultHours(): OperatingHours {
  const day = { open: "08:00", close: "20:00" };
  return {
    mon: { ...day },
    tue: { ...day },
    wed: { ...day },
    thu: { ...day },
    fri: { ...day },
    sat: { ...day },
    sun: { ...day },
  };
}

interface VenueFormState {
  name: string;
  address: string;
  phone: string;
  lat: string;
  lng: string;
  surfaceType: "indoor" | "outdoor";
  amenities: string[];
  operatingHours: OperatingHours;
  sameHours: boolean;
  images: string[];
}

function venueToForm(v: Venue): VenueFormState {
  return {
    name: v.name,
    address: v.address,
    phone: v.phone,
    lat: String(v.lat),
    lng: String(v.lng),
    surfaceType: v.surface_type === "mixed" ? "outdoor" : v.surface_type,
    amenities: v.amenities,
    operatingHours: v.operating_hours,
    sameHours: false,
    images: v.images,
  };
}

function emptyForm(): VenueFormState {
  return {
    name: "",
    address: "",
    phone: "",
    lat: "30.2672",
    lng: "-97.7431",
    surfaceType: "outdoor",
    amenities: [],
    operatingHours: defaultHours(),
    sameHours: true,
    images: [],
  };
}

function extractStoragePath(url: string): string | null {
  const marker = "/court-images/";
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

interface OwnerDashboardProps {
  user: { id: string; name: string };
}

export default function OwnerDashboard({ user }: OwnerDashboardProps) {
  const supabase = createSupabaseBrowserClient();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "manage">("list");
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null);
  const [units, setUnits] = useState<CourtUnit[]>([]);
  const [form, setForm] = useState<VenueFormState>(emptyForm());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("courts")
      .select("*")
      .eq("owner_id", user.id)
      .order("name");
    if (!err && data) setVenues(data as Venue[]);
    setLoading(false);
  }, [supabase, user.id]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const fetchUnits = useCallback(
    async (venueId: string) => {
      const { data, error: err } = await supabase
        .from("court_units")
        .select("*")
        .eq("court_id", venueId)
        .order("number");
      if (!err && data) setUnits(data as CourtUnit[]);
    },
    [supabase]
  );

  const openCreate = () => {
    setForm(emptyForm());
    setPendingId(crypto.randomUUID());
    setError("");
    setView("create");
  };

  const openManage = async (venue: Venue) => {
    setForm(venueToForm(venue));
    setActiveVenueId(venue.id);
    setError("");
    await fetchUnits(venue.id);
    setView("manage");
  };

  const backToList = () => {
    setView("list");
    setActiveVenueId(null);
    setPendingId(null);
    fetchVenues();
  };

  const uploadImages = async (files: FileList, ownerScopedId: string) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${ownerScopedId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: uploadErr } = await supabase.storage
        .from("court-images")
        .upload(path, file);
      if (uploadErr) {
        setError(uploadErr.message);
        continue;
      }
      const { data } = supabase.storage.from("court-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setUploading(false);
    return urls;
  };

  const handleAddImages = async (
    e: React.ChangeEvent<HTMLInputElement>,
    persist: boolean
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const scopeId = view === "create" ? pendingId! : activeVenueId!;
    const urls = await uploadImages(files, scopeId);
    const nextImages = [...form.images, ...urls];
    setForm((f) => ({ ...f, images: nextImages }));
    if (persist && activeVenueId) {
      await supabase
        .from("courts")
        .update({ images: nextImages })
        .eq("id", activeVenueId);
    }
    e.target.value = "";
  };

  const handleRemoveImage = async (url: string, persist: boolean) => {
    const nextImages = form.images.filter((i) => i !== url);
    setForm((f) => ({ ...f, images: nextImages }));
    const path = extractStoragePath(url);
    if (path) await supabase.storage.from("court-images").remove([path]);
    if (persist && activeVenueId) {
      await supabase
        .from("courts")
        .update({ images: nextImages })
        .eq("id", activeVenueId);
    }
  };

  const applySameHours = (open: string, close: string) => {
    const hours = defaultHours();
    for (const key of DAY_KEYS) hours[key] = { open, close };
    setForm((f) => ({ ...f, operatingHours: hours }));
  };

  const toggleAmenity = (value: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(value)
        ? f.amenities.filter((a) => a !== value)
        : [...f.amenities, value],
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Establishment name is required";
    if (!form.address.trim()) return "Address is required";
    if (!form.phone.trim()) return "Phone is required";
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng))
      return "Latitude and longitude must be numbers";
    return "";
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    const id = pendingId!;
    const { error: insertErr } = await supabase.from("courts").insert({
      id,
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      surface_type: form.surfaceType,
      amenities: form.amenities,
      operating_hours: form.operatingHours,
      images: form.images,
      owner_id: user.id,
      number_of_courts: 0,
    });
    if (insertErr) {
      setError(insertErr.message);
      setSaving(false);
      return;
    }
    await supabase.from("court_units").insert({
      court_id: id,
      number: 1,
      name: "Court 1",
      is_active: true,
      surface_type: form.surfaceType,
    });
    setSaving(false);
    backToList();
  };

  const handleSaveDetails = async () => {
    if (!activeVenueId) return;
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    const { error: updateErr } = await supabase
      .from("courts")
      .update({
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        amenities: form.amenities,
        operating_hours: form.operatingHours,
      })
      .eq("id", activeVenueId);
    setSaving(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    fetchVenues();
  };

  const handleDeleteVenue = async (venue: Venue) => {
    if (
      !confirm(
        `Delete "${venue.name}"? This removes all its courts and bookings.`
      )
    )
      return;
    await supabase.from("courts").delete().eq("id", venue.id);
    backToList();
  };

  const handleAddUnit = async () => {
    if (!activeVenueId) return;
    const nextNumber =
      units.length > 0 ? Math.max(...units.map((u) => u.number)) + 1 : 1;
    const activeVenueSurface = venues.find((v) => v.id === activeVenueId)
      ?.surface_type;
    const defaultSurface =
      activeVenueSurface && activeVenueSurface !== "mixed"
        ? activeVenueSurface
        : "outdoor";
    await supabase.from("court_units").insert({
      court_id: activeVenueId,
      number: nextNumber,
      name: `Court ${nextNumber}`,
      is_active: true,
      surface_type: defaultSurface,
    });
    fetchUnits(activeVenueId);
    fetchVenues();
  };

  const handleRenameUnit = async (unit: CourtUnit, name: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unit.id ? { ...u, name } : u))
    );
    await supabase.from("court_units").update({ name }).eq("id", unit.id);
  };

  const handleToggleUnit = async (unit: CourtUnit) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unit.id ? { ...u, is_active: !u.is_active } : u
      )
    );
    await supabase
      .from("court_units")
      .update({ is_active: !unit.is_active })
      .eq("id", unit.id);
  };

  const handleUpdateUnitSurface = async (
    unit: CourtUnit,
    surfaceType: "indoor" | "outdoor"
  ) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unit.id ? { ...u, surface_type: surfaceType } : u
      )
    );
    await supabase
      .from("court_units")
      .update({ surface_type: surfaceType })
      .eq("id", unit.id);
    fetchVenues();
  };

  const handleDeleteUnit = async (unit: CourtUnit) => {
    if (!confirm(`Remove ${unit.name || `Court ${unit.number}`}?`)) return;
    await supabase.from("court_units").delete().eq("id", unit.id);
    if (activeVenueId) fetchUnits(activeVenueId);
    fetchVenues();
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({
        ...f,
        lat: String(pos.coords.latitude),
        lng: String(pos.coords.longitude),
      }));
    });
  };

  // ---------------------------------------------------------------------
  // List view
  // ---------------------------------------------------------------------
  if (view === "list") {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Venues</h2>
            <p className="text-sm text-gray-500">
              Manage the establishments and courts you own
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors text-sm"
          >
            Add Establishment
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-4 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              No venues yet
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Add your first establishment to start accepting bookings.
            </p>
            <button
              onClick={openCreate}
              className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors text-sm"
            >
              Add Establishment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {venues.map((v) => (
              <button
                key={v.id}
                onClick={() => openManage(v)}
                className="text-left bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
              >
                <div className="h-28 bg-gray-100 flex items-center justify-center text-gray-300">
                  {v.images[0] ? (
                    <img
                      src={v.images[0]}
                      alt={v.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CameraIcon className="w-8 h-8" />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {v.address}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {SURFACE_LABELS[v.surface_type]} · {v.number_of_courts} court
                    {v.number_of_courts !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    );
  }

  // ---------------------------------------------------------------------
  // Create / Manage views share the same form
  // ---------------------------------------------------------------------
  const isCreate = view === "create";
  const activeVenue = venues.find((v) => v.id === activeVenueId);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={backToList}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1.5"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to venues
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {isCreate ? "Add Establishment" : form.name}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm mb-4 border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Photos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Photos</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.images.map((url) => (
              <div key={url} className="relative w-20 h-20 group">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  onClick={() => handleRemoveImage(url, !isCreate)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-300 text-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 cursor-pointer text-xs text-center">
              <CameraIcon className="w-5 h-5" />
              {uploading ? "..." : "Add"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleAddImages(e, !isCreate)}
              />
            </label>
          </div>
        </div>

        {/* Basic details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Establishment Details
          </h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Establishment Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. Zilker Park Pickleball Courts"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="Street, city, state, zip"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="(512) 555-0100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Surface
              </label>
              {isCreate ? (
                <select
                  value={form.surfaceType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      surfaceType: e.target.value as "indoor" | "outdoor",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800"
                >
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
              ) : (
                <p className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-500 bg-gray-50">
                  {activeVenue ? SURFACE_LABELS[activeVenue.surface_type] : "—"}
                </p>
              )}
            </div>
          </div>
          {!isCreate && (
            <p className="text-xs text-gray-400">
              Set per court below — the establishment shows Indoor & Outdoor
              automatically when its courts differ.
            </p>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">
                Coordinates (for the map)
              </label>
              <button
                type="button"
                onClick={useMyLocation}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
              >
                <LocateIcon className="w-3.5 h-3.5" />
                Use my location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.lat}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lat: e.target.value }))
                }
                placeholder="Latitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800"
              />
              <input
                type="text"
                value={form.lng}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lng: e.target.value }))
                }
                placeholder="Longitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Amenities
          </h3>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleAmenity(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  form.amenities.includes(opt.value)
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Operating hours */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Available Time
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={form.sameHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sameHours: e.target.checked }))
                }
              />
              Same hours every day
            </label>
          </div>

          {form.sameHours ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={form.operatingHours.mon.open}
                onChange={(e) =>
                  applySameHours(e.target.value, form.operatingHours.mon.close)
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={form.operatingHours.mon.close}
                onChange={(e) =>
                  applySameHours(form.operatingHours.mon.open, e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {DAY_KEYS.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-gray-600">
                    {DAY_LABELS[day]}
                  </span>
                  <input
                    type="time"
                    value={form.operatingHours[day].open}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        operatingHours: {
                          ...f.operatingHours,
                          [day]: {
                            ...f.operatingHours[day],
                            open: e.target.value,
                          },
                        },
                      }))
                    }
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs text-gray-800"
                  />
                  <span className="text-gray-400 text-xs">to</span>
                  <input
                    type="time"
                    value={form.operatingHours[day].close}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        operatingHours: {
                          ...f.operatingHours,
                          [day]: {
                            ...f.operatingHours[day],
                            close: e.target.value,
                          },
                        },
                      }))
                    }
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-xs text-gray-800"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Courts management (only once venue exists) */}
        {!isCreate && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Courts</h3>
              <button
                onClick={handleAddUnit}
                className="text-xs px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                Add Court
              </button>
            </div>
            {units.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No courts yet — add one so players can book.
              </p>
            ) : (
              <>
              <div className="space-y-2">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className={`flex flex-wrap items-center gap-2 p-2 rounded-md border ${
                      unit.is_active
                        ? "border-gray-200 bg-white"
                        : "border-gray-200 bg-gray-50 opacity-70"
                    }`}
                  >
                    <input
                      type="text"
                      defaultValue={unit.name || `Court ${unit.number}`}
                      onBlur={(e) =>
                        handleRenameUnit(unit, e.target.value.trim())
                      }
                      className="flex-1 min-w-[100px] px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <select
                      value={unit.surface_type ?? "outdoor"}
                      onChange={(e) =>
                        handleUpdateUnitSurface(
                          unit,
                          e.target.value as "indoor" | "outdoor"
                        )
                      }
                      className="shrink-0 px-2 py-1.5 border border-gray-200 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="outdoor">Outdoor</option>
                      <option value="indoor">Indoor</option>
                    </select>
                    <button
                      onClick={() => handleToggleUnit(unit)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        unit.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {unit.is_active ? "Available" : "Unavailable"}
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(unit)}
                      className="shrink-0 text-gray-400 hover:text-red-600"
                      aria-label="Delete court"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Every court follows the establishment&apos;s available time
                above.
              </p>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          {!isCreate && activeVenue && (
            <button
              onClick={() => handleDeleteVenue(activeVenue)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete establishment
            </button>
          )}
          <button
            onClick={isCreate ? handleCreate : handleSaveDetails}
            disabled={saving}
            className="ml-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
          >
            {saving
              ? "Saving..."
              : isCreate
                ? "Create Establishment"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
