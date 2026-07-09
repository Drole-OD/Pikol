import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.json({
    id: data.user.id,
    name: profile?.name ?? data.user.user_metadata?.name ?? data.user.email,
    email: data.user.email,
    role: profile?.role ?? data.user.user_metadata?.role ?? "player",
  });
}
