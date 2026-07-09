import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { name, email, password, role } = await request.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Name, email, password, and role are required" },
      { status: 400 }
    );
  }
  if (role !== "player" && role !== "owner") {
    return NextResponse.json(
      { error: "Role must be either 'player' or 'owner'" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { name: name.trim(), role },
    },
  });

  if (error) {
    const status = error.message.toLowerCase().includes("registered") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  if (!data.user) {
    return NextResponse.json(
      { error: "Check your email to confirm your account" },
      { status: 202 }
    );
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    name: name.trim(),
    role,
  });
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: data.user.id,
      name: name.trim(),
      email: data.user.email,
      role,
    },
    { status: 201 }
  );
}
