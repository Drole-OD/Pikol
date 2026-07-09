"use client";

import { useState, useEffect } from "react";
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/AuthModal";
import PlayerDashboard from "@/components/PlayerDashboard";
import CourtFinderView from "@/components/CourtFinderView";
import OwnerDashboard from "@/components/OwnerDashboard";
import { LogoMark } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "player" | "owner";
}

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [browseCourts, setBrowseCourts] = useState(false);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    )
      return;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", authUser.id)
        .maybeSingle();
      setUser({
        id: authUser.id,
        name:
          profile?.name ??
          (authUser.user_metadata?.name as string) ??
          authUser.email ??
          "",
        email: authUser.email ?? "",
        role:
          (profile?.role as "player" | "owner") ??
          (authUser.user_metadata?.role as "player" | "owner") ??
          "player",
      });
    });
  }, []);

  const handleAuthSuccess = (u: AppUser) => {
    setUser(u);
    setAuthMode(null);
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) {
    if (browseCourts) {
      return (
        <div className="min-h-screen bg-white">
          <nav className="border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => setBrowseCourts(false)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 tracking-tight"
              >
                <LogoMark className="w-6 h-6 text-emerald-600" />
                Pikol
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setBrowseCourts(false);
                    setAuthMode("signin");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setBrowseCourts(false);
                    setAuthMode("signup");
                  }}
                  className="px-4 py-2 text-sm bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </nav>
          <main className="max-w-5xl mx-auto px-4 py-8">
            <CourtFinderView isAuthenticated={false} />
          </main>
        </div>
      );
    }

    return (
      <>
        <LandingPage
          onSignIn={() => setAuthMode("signin")}
          onSignUp={() => setAuthMode("signup")}
          onFindCourts={() => setBrowseCourts(true)}
        />
        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSuccess={handleAuthSuccess}
            onToggleMode={() =>
              setAuthMode((m) => (m === "signin" ? "signup" : "signin"))
            }
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-semibold text-gray-900 tracking-tight">
            <LogoMark className="w-6 h-6 text-emerald-600" />
            Pikol
          </span>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm text-gray-600">
                Hi, <span className="font-medium">{user.name}</span>
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {user.role === "owner" ? "Court Owner" : "Player"}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {user.role === "player" && <PlayerDashboard user={user} />}

      {user.role === "owner" && <OwnerDashboard user={user} />}
    </div>
  );
}
