import { NextRequest, NextResponse } from "next/server";
import {
  getCourtById,
  getCourtUnits,
  getBookingsByDate,
  TIME_SLOTS,
  getDayKey,
} from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const court = await getCourtById(id);

  if (!court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  const units = await getCourtUnits(id);

  const searchParams = request.nextUrl.searchParams;
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const courtNumber = searchParams.get("courtNumber");

  const bookings = await getBookingsByDate(date);
  const courtBookings = bookings.filter((b) => b.courtId === id);

  const d = new Date(date + "T00:00:00");
  const dayKey = getDayKey(d);
  const hours = court.operatingHours[dayKey];

  const operatingSlots = hours.closed
    ? []
    : TIME_SLOTS.filter((s) => s.start >= hours.open && s.end <= hours.close);

  if (courtNumber) {
    const cn = parseInt(courtNumber);
    const slots = operatingSlots.map((slot) => {
      const booking = courtBookings.find(
        (b) =>
          b.courtNumber === cn &&
          b.startTime === slot.start &&
          b.endTime === slot.end
      );
      return {
        ...slot,
        available: !booking,
        bookedBy: booking?.playerName || null,
      };
    });

    return NextResponse.json({
      ...court,
      units,
      slots,
      hoursToday: hours,
    });
  }

  const slots = operatingSlots.map((slot) => {
    const bookingsForSlot = courtBookings.filter(
      (b) => b.startTime === slot.start && b.endTime === slot.end
    );
    const availableCourts = court.numberOfCourts - bookingsForSlot.length;
    return {
      ...slot,
      available: availableCourts > 0,
      availableCourts,
      bookedBy: null,
    };
  });

  return NextResponse.json({
    ...court,
    units,
    slots,
    hoursToday: hours,
  });
}
