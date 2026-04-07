"use client";

import { format, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

const BASE_TIME_SLOTS = Array.from({ length: 48 }, (_, idx) => {
  const hour = Math.floor(idx / 2);
  const minute = idx % 2 === 0 ? 0 : 30;
  return {
    available: true,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
});

type Calendar10Props = {
  date: Date | null;
  time: string | null;
  minDate?: Date;
  maxDate?: Date;
  onDateChange: (newDate: Date) => void;
  onTimeChange: (newTime: string | null) => void;
};

export default function Calendar10({
  date,
  time,
  minDate,
  maxDate,
  onDateChange,
  onTimeChange,
}: Calendar10Props) {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const effectiveMinDate = minDate
    ? new Date(minDate)
    : new Date(todayStart);
  effectiveMinDate.setHours(0, 0, 0, 0);
  const effectiveMaxDate = maxDate ? new Date(maxDate) : null;
  if (effectiveMaxDate) effectiveMaxDate.setHours(0, 0, 0, 0);

  const activeDate = date ?? effectiveMinDate;

  const timeSlots = BASE_TIME_SLOTS.map((slot) => {
    if (!date) {
      return { ...slot, available: false };
    }

    if (!isSameDay(activeDate, todayStart)) {
      return slot;
    }

    const [hour, minute] = slot.time.split(":").map(Number);
    const candidate = new Date(activeDate);
    candidate.setHours(hour, minute, 0, 0);

    return {
      ...slot,
      available: slot.available && candidate > today,
    };
  });

  return (
    <div className="rounded-md border">
      <div className="flex max-sm:flex-col">
        <Calendar
          className="p-2 sm:pe-5"
          disabled={[
            { before: effectiveMinDate },
            ...(effectiveMaxDate ? [{ after: effectiveMaxDate }] : []),
          ]}
          mode="single"
          onSelect={(newDate) => {
            if (newDate) {
              onDateChange(newDate);
              onTimeChange(null);
            }
          }}
          selected={date || undefined}
        />
        <div className="relative w-full max-sm:h-48 sm:w-40">
          <div className="absolute inset-0 py-4 max-sm:border-t">
            <ScrollArea className="h-full sm:border-s">
              <div className="space-y-3">
                <div className="flex h-5 shrink-0 items-center pl-5 pr-2">
                  <p className="text-sm font-medium">
                    {date ? format(activeDate, "EEEE, d") : "Select a day"}
                  </p>
                </div>
                <div className="grid gap-1.5 pl-5 pr-2 max-sm:grid-cols-2">
                  {timeSlots.map(({ time: timeSlot, available }) => (
                    <Button
                      className="w-full"
                      disabled={!available}
                      key={timeSlot}
                      onClick={() => onTimeChange(timeSlot)}
                      size="sm"
                      variant={time === timeSlot ? "default" : "outline"}
                    >
                      {timeSlot}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
