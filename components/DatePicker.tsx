"use client";

interface DatePickerProps {
  date: string;
  onChange: (date: string) => void;
}

export default function DatePicker({ date, onChange }: DatePickerProps) {
  const shift = (days: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().split("T")[0]);
  };

  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => shift(-1)}
        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
      >
        &larr;
      </button>
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800">{formatted}</p>
        <input
          type="date"
          value={date}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm text-emerald-600 cursor-pointer border-none bg-transparent"
        />
      </div>
      <button
        onClick={() => shift(1)}
        className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
      >
        &rarr;
      </button>
    </div>
  );
}
