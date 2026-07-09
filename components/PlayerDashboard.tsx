"use client";

import { useState, useEffect, useCallback } from "react";
import CourtFinderView from "@/components/CourtFinderView";
import { CheckIcon } from "@/components/icons";

interface Booking {
  id: string;
  courtId: string;
  courtNumber?: number;
  date: string;
  startTime: string;
  endTime: string;
  playerName: string;
  userId?: string;
}

interface CourtInfo {
  id: string;
  name: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

function formatTime(t: string) {
  const [h] = t.split(":");
  const hour = parseInt(h) % 24;
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:00 ${ampm}`;
}

function computeAchievements(bookings: Booking[]): Achievement[] {
  const totalCount = bookings.length;
  const courtIds = new Set(bookings.map((b) => b.courtId));
  const hasEarlyBird = bookings.some((b) => parseInt(b.startTime) < 9);
  const hasNightOwl = bookings.some((b) => parseInt(b.startTime) >= 18);
  const hasWeekend = bookings.some((b) => {
    const day = new Date(b.date + "T00:00:00").getDay();
    return day === 0 || day === 6;
  });

  return [
    { id: "first-serve", title: "First Serve", description: "Make your first booking", unlocked: totalCount >= 1 },
    { id: "regular", title: "Regular", description: "Complete 5 bookings", unlocked: totalCount >= 5 },
    { id: "dedicated", title: "Dedicated Player", description: "Complete 10 bookings", unlocked: totalCount >= 10 },
    { id: "early-bird", title: "Early Bird", description: "Book a slot before 9 AM", unlocked: hasEarlyBird },
    { id: "night-owl", title: "Night Owl", description: "Book a slot at 6 PM or later", unlocked: hasNightOwl },
    { id: "court-hopper", title: "Court Hopper", description: "Play on 3+ different courts", unlocked: courtIds.size >= 3 },
    { id: "weekend-warrior", title: "Weekend Warrior", description: "Book a weekend slot", unlocked: hasWeekend },
    { id: "marathon", title: "Marathon Player", description: "Complete 25 bookings", unlocked: totalCount >= 25 },
  ];
}

interface PlayerDashboardProps {
  user: { id: string; name: string; email: string; role: string };
}

export default function PlayerDashboard({ user }: PlayerDashboardProps) {
  const today = new Date().toISOString().split("T")[0];
  const [tab, setTab] = useState<"find" | "mybookings" | "achievements">("find");
  const [courts, setCourts] = useState<CourtInfo[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  const fetchMyBookings = useCallback(async () => {
    const res = await fetch(`/api/bookings?userId=${user.id}`);
    const data = await res.json();
    setMyBookings(data);
  }, [user.id]);

  useEffect(() => {
    fetch("/api/courts")
      .then((r) => r.json())
      .then((data: CourtInfo[]) => setCourts(data));
    fetchMyBookings();
  }, [fetchMyBookings]);

  const handleCancel = async (bookingId: string) => {
    const res = await fetch(`/api/bookings?id=${bookingId}`, { method: "DELETE" });
    if (res.ok) fetchMyBookings();
  };

  const achievements = computeAchievements(myBookings);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const upcomingBookings = myBookings
    .filter((b) => b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const pastBookings = myBookings
    .filter((b) => b.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  const tabs = [
    { id: "find" as const, label: "Find Courts" },
    { id: "mybookings" as const, label: "My Bookings" },
    { id: "achievements" as const, label: "Achievements" },
  ];

  return (
    <>
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
                {t.id === "mybookings" && myBookings.length > 0 && (
                  <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {myBookings.length}
                  </span>
                )}
                {t.id === "achievements" && (
                  <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {unlockedCount}/{achievements.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === "find" && (
          <CourtFinderView
            isAuthenticated={true}
            userId={user.id}
            userName={user.name}
            onBookingComplete={fetchMyBookings}
          />
        )}

        {tab === "mybookings" && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-center">
                <div className="text-xl font-semibold text-gray-900">{myBookings.length}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-center">
                <div className="text-xl font-semibold text-gray-900">{upcomingBookings.length}</div>
                <div className="text-xs text-gray-500">Upcoming</div>
              </div>
              <div className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-center">
                <div className="text-xl font-semibold text-gray-900">{pastBookings.length}</div>
                <div className="text-xs text-gray-500">Past</div>
              </div>
            </div>

            {upcomingBookings.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Upcoming
                </h3>
                <div className="space-y-2">
                  {upcomingBookings.map((b) => {
                    const court = courts.find((c) => c.id === b.courtId);
                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="border border-gray-200 rounded-md px-3 py-1 text-center min-w-[80px]">
                            <div className="text-xs font-medium text-gray-700">
                              {new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                            <div className="text-xs text-gray-500">{formatTime(b.startTime)}</div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {court?.name ?? `Court ${b.courtId}`}
                              {b.courtNumber && <span className="text-gray-400 font-normal"> · Court {b.courtNumber}</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(b.startTime)} – {formatTime(b.endTime)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="text-xs px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Past
                </h3>
                <div className="space-y-2">
                  {pastBookings.map((b) => {
                    const court = courts.find((c) => c.id === b.courtId);
                    return (
                      <div
                        key={b.id}
                        className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-100 px-4 py-3"
                      >
                        <div className="border border-gray-200 rounded-md px-3 py-1 text-center min-w-[80px]">
                          <div className="text-xs font-medium text-gray-600">
                            {new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          <div className="text-xs text-gray-400">{formatTime(b.startTime)}</div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600 text-sm">
                            {court?.name ?? `Court ${b.courtId}`}
                            {b.courtNumber && <span className="text-gray-400 font-normal"> · Court {b.courtNumber}</span>}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTime(b.startTime)} – {formatTime(b.endTime)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {myBookings.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  No bookings yet
                </h3>
                <p className="text-gray-500 mb-4 text-sm">
                  Find a court and book a slot to get started!
                </p>
                <button
                  onClick={() => setTab("find")}
                  className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors text-sm"
                >
                  Find Courts
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "achievements" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-lg font-semibold text-gray-900">
                {unlockedCount} of {achievements.length} Unlocked
              </h2>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 max-w-xs mx-auto">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    a.unlocked ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className={`font-semibold text-sm ${a.unlocked ? "text-emerald-800" : "text-gray-500"}`}>
                        {a.title}
                      </h3>
                      <p className={`text-xs ${a.unlocked ? "text-emerald-600" : "text-gray-400"}`}>
                        {a.description}
                      </p>
                    </div>
                    {a.unlocked && <CheckIcon className="ml-auto w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
