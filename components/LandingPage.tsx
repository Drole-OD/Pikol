"use client";

import { LogoMark } from "@/components/icons";

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
  onFindCourts?: () => void;
}

export default function LandingPage({ onSignIn, onSignUp, onFindCourts }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-semibold text-gray-900 tracking-tight">
            <LogoMark className="w-6 h-6 text-emerald-600" />
            Pikol
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onSignUp}
              className="px-4 py-2 text-sm bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-6 tracking-tight">
            Book your pickleball court
            <br />
            <span className="text-emerald-600">in seconds</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            No more phone calls or paper sign-up sheets. Pick a court, choose
            your time, and you&apos;re on the court.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={onSignUp}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors"
            >
              Get Started — It&apos;s Free
            </button>
            <button
              onClick={onSignIn}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:border-gray-400 transition-colors"
            >
              Sign In
            </button>
            {onFindCourts && (
              <button
                onClick={onFindCourts}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:border-gray-400 transition-colors"
              >
                Find Courts Near Me
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <span className="text-xs font-medium text-gray-400 tracking-wide">
              01
            </span>
            <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1">
              Pick a date
            </h3>
            <p className="text-sm text-gray-500">
              Browse available time slots across all courts for any day.
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 tracking-wide">
              02
            </span>
            <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1">
              Book instantly
            </h3>
            <p className="text-sm text-gray-500">
              One click to reserve your slot. No waiting, no hassle.
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-400 tracking-wide">
              03
            </span>
            <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1">
              Play
            </h3>
            <p className="text-sm text-gray-500">
              Show up at your time — your court is ready.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          &copy; 2026 PickleBook. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
