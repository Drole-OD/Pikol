"use client";

interface Booking {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  playerName: string;
  userId?: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface CourtScheduleProps {
  courtId: string;
  courtName: string;
  timeSlots: TimeSlot[];
  bookings: Booking[];
  currentUserId?: string;
  onSlotClick: (courtId: string, start: string, end: string) => void;
  onCancel: (bookingId: string) => void;
}

function formatTime(t: string) {
  const [h] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:00 ${ampm}`;
}

export default function CourtSchedule({
  courtId,
  courtName,
  timeSlots,
  bookings,
  currentUserId,
  onSlotClick,
  onCancel,
}: CourtScheduleProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-emerald-600 px-4 py-3">
        <h3 className="text-white font-bold text-lg">{courtName}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {timeSlots.map((slot) => {
          const booking = bookings.find(
            (b) => b.courtId === courtId && b.startTime === slot.start
          );

          if (booking) {
            const isOwner = currentUserId && booking.userId === currentUserId;
            return (
              <div
                key={slot.start}
                className={`flex items-center justify-between px-4 py-3 ${
                  isOwner ? "bg-emerald-100" : "bg-emerald-50"
                }`}
              >
                <div>
                  <span className="text-sm text-gray-500">
                    {formatTime(slot.start)}
                  </span>
                  <span className="ml-2 text-sm font-medium text-emerald-800">
                    {booking.playerName}
                  </span>
                  {isOwner && (
                    <span className="ml-1.5 text-xs text-emerald-600">(You)</span>
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={() => onCancel(booking.id)}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            );
          }

          return (
            <button
              key={slot.start}
              onClick={() => onSlotClick(courtId, slot.start, slot.end)}
              className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors group"
            >
              <span className="text-sm text-gray-500">
                {formatTime(slot.start)}
              </span>
              <span className="ml-2 text-sm text-gray-400 group-hover:text-emerald-600 transition-colors">
                Available
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
