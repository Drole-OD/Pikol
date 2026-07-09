import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const date = request.nextUrl.searchParams.get("date");
  const userId = request.nextUrl.searchParams.get("userId");

  if (userId) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data.map(rowToClient));
  }

  if (!date) {
    return NextResponse.json(
      { error: "date or userId query parameter is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("date", date);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data.map(rowToClient));
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const { courtId, courtNumber, date, startTime, endTime, playerName } = body;

  if (
    !courtId ||
    !date ||
    !startTime ||
    !endTime ||
    !playerName ||
    !courtNumber
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      court_id: courtId,
      court_number: courtNumber,
      date,
      start_time: startTime,
      end_time: endTime,
      player_name: playerName.trim(),
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    const message =
      error.code === "23505" ? "This slot is already booked" : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(rowToClient(data), { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  const { error, count } = await supabase
    .from("bookings")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
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

function rowToClient(r: BookingRow) {
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
