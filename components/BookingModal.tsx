"use client";

import { useState } from "react";

interface BookingModalProps {
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  onConfirm: (playerName: string) => void;
  onClose: () => void;
}

function formatTime(t: string) {
  const [h] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:00 ${ampm}`;
}

export default function BookingModal({
  courtName,
  date,
  startTime,
  endTime,
  onConfirm,
  onClose,
}: BookingModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Book a Slot</h2>
        <p className="text-gray-500 mb-4">
          {courtName} &middot; {formatTime(startTime)} &ndash;{" "}
          {formatTime(endTime)}
          <br />
          <span className="text-sm">{date}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
