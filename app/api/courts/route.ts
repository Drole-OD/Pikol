import { NextRequest, NextResponse } from "next/server";
import {
  getCourts,
  getBookingsByDate,
  isCourtOpenNow,
  getAvailableSlotsCount,
  haversineDistance,
} from "@/lib/data";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = params.get("lat");
  const lng = params.get("lng");
  const amenities = params.get("amenities");
  const openNow = params.get("openNow");
  const date = params.get("date") || new Date().toISOString().split("T")[0];

  let courts = await getCourts();
  const bookings = await getBookingsByDate(date);

  if (openNow === "true") {
    courts = courts.filter((c) => isCourtOpenNow(c));
  }

  if (amenities) {
    const required = amenities.split(",");
    courts = courts.filter((c) =>
      required.every((a) => c.amenities.includes(a))
    );
  }

  const result = courts.map((court) => {
    const availableSlots = getAvailableSlotsCount(court, date, bookings);
    const distance =
      lat && lng
        ? haversineDistance(parseFloat(lat), parseFloat(lng), court.lat, court.lng)
        : null;

    return {
      ...court,
      availableSlots,
      isOpen: isCourtOpenNow(court),
      distance: distance !== null ? Math.round(distance * 10) / 10 : null,
    };
  });

  if (lat && lng) {
    result.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }

  return NextResponse.json(result);
}
