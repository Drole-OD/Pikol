"use client";

import { useState } from "react";
import { XIcon } from "@/components/icons";

interface AuthModalProps {
  mode: "signin" | "signup";
  onClose: () => void;
  onSuccess: (user: {
    id: string;
    name: string;
    email: string;
    role: "player" | "owner";
  }) => void;
  onToggleMode: () => void;
}

export default function AuthModal({
  mode,
  onClose,
  onSuccess,
  onToggleMode,
}: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"player" | "owner">("player");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint =
      mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
    const body =
      mode === "signup"
        ? { name: name.trim(), email, password, role }
        : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      onSuccess(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === "signup";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg p-8 w-full max-w-md mx-4 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          {isSignUp
            ? "Sign up to start booking courts"
            : "Sign in to your account"}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("player")}
                    className={`p-4 rounded-md border text-left transition-colors ${
                      role === "player"
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium text-sm text-gray-900">Player</span>
                    <span className="block text-xs mt-0.5 text-gray-500">
                      Book courts and play
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`p-4 rounded-md border text-left transition-colors ${
                      role === "owner"
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium text-sm text-gray-900">Court Owner</span>
                    <span className="block text-xs mt-0.5 text-gray-500">
                      Manage your courts
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800 text-sm"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "At least 6 characters" : "Your password"}
              required
              minLength={isSignUp ? 6 : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-800 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={onToggleMode}
            className="text-gray-900 font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
