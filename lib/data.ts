import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface DayHours {
  open: string;
  close: string;
}

export interface OperatingHours {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  numberOfCourts: number;
  surfaceType: "indoor" | "outdoor" | "mixed";
  amenities: string[];
  operatingHours: OperatingHours;
  images: string[];
  ownerId: string | null;
}

export interface CourtUnit {
  id: string;
  number: number;
  name: string | null;
  isActive: boolean;
  surfaceType: "indoor" | "outdoor";
}

export interface Booking {
  id: string;
  courtId: string;
  courtNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  playerName: string;
  userId: string | null;
  createdAt: string;
}

interface CourtRow {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  number_of_courts: number;
  surface_type: "indoor" | "outdoor" | "mixed";
  amenities: string[];
  operating_hours: OperatingHours;
  images: string[];
  owner_id: string | null;
}

interface CourtUnitRow {
  id: string;
  number: number;
  name: string | null;
  is_active: boolean;
  surface_type: "indoor" | "outdoor" | null;
}

interface BookingRow {
  id: string;
  court_id: string;
  court_number: number;
  date: string;
  start_time: string;
  end_time: string;
  player_name: string;
  user_id: string | null;
  created_at: string;
}

function rowToCourt(r: CourtRow): Court {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    phone: r.phone,
    numberOfCourts: r.number_of_courts,
    surfaceType: r.surface_type,
    amenities: r.amenities,
    operatingHours: r.operating_hours,
    images: r.images ?? [],
    ownerId: r.owner_id,
  };
}

function rowToCourtUnit(r: CourtUnitRow): CourtUnit {
  return {
    id: r.id,
    number: r.number,
    name: r.name,
    isActive: r.is_active,
    surfaceType: r.surface_type ?? "outdoor",
  };
}

function rowToBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    courtId: r.court_id,
    courtNumber: r.court_number,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    playerName: r.player_name,
    userId: r.user_id,
    createdAt: r.created_at,
  };
}

export async function getCourts(): Promise<Court[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("courts").select("*");
  if (error) throw error;
  return (data as CourtRow[]).map(rowToCourt);
}

export async function getCourtById(id: string): Promise<Court | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToCourt(data as CourtRow) : null;
}

export async function getCourtUnits(
  courtId: string,
  activeOnly = true
): Promise<CourtUnit[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("court_units")
    .select("*")
    .eq("court_id", courtId)
    .order("number", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as CourtUnitRow[]).map(rowToCourtUnit);
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("date", date);
  if (error) throw error;
  return (data as BookingRow[]).map(rowToBooking);
}

export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data as BookingRow[]).map(rowToBooking);
}

// Full-day hourly slots (00:00–24:00). Actual availability for a given
// establishment or court is derived by filtering these against its own
// operating hours, so this must cover every hour any owner could set.
export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const start = `${i.toString().padStart(2, "0")}:00`;
  const end = `${(i + 1).toString().padStart(2, "0")}:00`;
  return { start, end };
});

const DAY_KEYS: (keyof OperatingHours)[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export function getDayKey(date: Date): keyof OperatingHours {
  return DAY_KEYS[date.getDay()];
}

export function isCourtOpenNow(court: Court): boolean {
  const now = new Date();
  const dayKey = getDayKey(now);
  const hours = court.operatingHours[dayKey];
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return currentTime >= hours.open && currentTime < hours.close;
}

export function getAvailableSlotsCount(
  court: Court,
  date: string,
  bookings: Booking[]
): number {
  const d = new Date(date + "T00:00:00");
  const dayKey = getDayKey(d);
  const hours = court.operatingHours[dayKey];
  const courtBookings = bookings.filter((b) => b.courtId === court.id);

  let count = 0;
  for (const slot of TIME_SLOTS) {
    if (slot.start >= hours.open && slot.end <= hours.close) {
      const totalForSlot = courtBookings.filter(
        (b) => b.startTime === slot.start && b.endTime === slot.end
      ).length;
      if (totalForSlot < court.numberOfCourts) count++;
    }
  }
  return count;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
