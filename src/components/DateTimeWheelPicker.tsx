"use client";

import { useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { WheelPicker, WheelPickerWrapper, type WheelPickerOption } from "@/components/wheel-picker/wheel-picker";

interface DateTimeWheelPickerProps {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  max?: Date;
  daysBack?: number;
}

export default function DateTimeWheelPicker({
  label,
  value,
  onChange,
  max,
  daysBack = 60,
}: DateTimeWheelPickerProps) {
  const fallbackMaxRef = useRef(normalizeToMinute(max ?? new Date()));
  const maxTime = max?.getTime() ?? fallbackMaxRef.current.getTime();

  const maxDate = useMemo(() => normalizeToMinute(max ?? fallbackMaxRef.current), [maxTime]);
  const selectedDate = useMemo(
    () => clampToMax(normalizeToMinute(value), maxDate),
    [maxDate, value.getTime()]
  );
  const selectedDayKey = formatLocalDayKey(selectedDate);
  const isOnMaxDay = isSameLocalDay(selectedDate, maxDate);

  const dateOptions = useMemo(
    () => buildDateOptions(selectedDate, maxDate, daysBack),
    [daysBack, maxDate, selectedDate]
  );
  const hourOptions = useMemo(
    () => buildHourOptions(isOnMaxDay ? maxDate.getHours() : null),
    [isOnMaxDay, maxDate]
  );
  const minuteOptions = useMemo(
    () => buildMinuteOptions(
      isOnMaxDay && selectedDate.getHours() === maxDate.getHours() ? maxDate.getMinutes() : null
    ),
    [isOnMaxDay, maxDate, selectedDate]
  );

  const applyNextDate = (next: Date) => {
    const normalized = clampToMax(normalizeToMinute(next), maxDate);
    if (normalized.getTime() !== selectedDate.getTime()) {
      onChange(normalized);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-muted/10 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wider">{label}</p>
          <p className="text-sm font-medium text-espresso mt-1">
            {selectedDate.toLocaleString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-muted/10 bg-oat/60 text-espresso hover:bg-oat"
          onClick={() => applyNextDate(maxDate)}
        >
          Now
        </Button>
      </div>

      <WheelPickerWrapper className="w-full rounded-[20px] border border-muted/10 bg-oat/35 p-2">
        <WheelPicker
          options={dateOptions}
          value={selectedDayKey}
          onValueChange={(nextDayKey) => {
            const next = setLocalDay(selectedDate, nextDayKey);
            applyNextDate(next);
          }}
          classNames={pickerClassNames}
        />
        <WheelPicker
          options={hourOptions}
          value={selectedDate.getHours()}
          onValueChange={(nextHour) => {
            const next = new Date(selectedDate);
            next.setHours(nextHour);
            applyNextDate(next);
          }}
          infinite
          classNames={pickerClassNames}
        />
        <WheelPicker
          options={minuteOptions}
          value={selectedDate.getMinutes()}
          onValueChange={(nextMinute) => {
            const next = new Date(selectedDate);
            next.setMinutes(nextMinute);
            applyNextDate(next);
          }}
          infinite
          classNames={pickerClassNames}
        />
      </WheelPickerWrapper>

      <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider text-muted px-1">
        <span className="text-left">Date</span>
        <span className="text-center">Hour</span>
        <span className="text-right">Minute</span>
      </div>
    </div>
  );
}

const pickerClassNames = {
  optionItem: "text-xs font-medium text-muted",
  highlightWrapper: "rounded-2xl border border-muted/10 bg-white text-espresso",
  highlightItem: "text-sm font-bold text-espresso",
};

function buildDateOptions(selectedDate: Date, maxDate: Date, daysBack: number): WheelPickerOption<string>[] {
  const latest = startOfLocalDay(maxDate);
  const earliest = startOfLocalDay(selectedDate);
  const defaultStart = new Date(latest);
  defaultStart.setDate(defaultStart.getDate() - (daysBack - 1));

  const start = earliest < defaultStart ? earliest : defaultStart;
  const options: WheelPickerOption<string>[] = [];

  for (const cursor = new Date(start); cursor <= latest; cursor.setDate(cursor.getDate() + 1)) {
    const day = new Date(cursor);
    options.push({
      value: formatLocalDayKey(day),
      label: formatDayLabel(day, latest),
    });
  }

  return options;
}

function buildHourOptions(maxHour: number | null): WheelPickerOption<number>[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    value: hour,
    label: pad(hour),
    disabled: maxHour !== null && hour > maxHour,
  }));
}

function buildMinuteOptions(maxMinute: number | null): WheelPickerOption<number>[] {
  return Array.from({ length: 60 }, (_, minute) => ({
    value: minute,
    label: pad(minute),
    disabled: maxMinute !== null && minute > maxMinute,
  }));
}

function formatDayLabel(date: Date, latest: Date) {
  if (isSameLocalDay(date, latest)) return "Today";

  const yesterday = new Date(latest);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameLocalDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function setLocalDay(date: Date, dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const next = new Date(date);
  next.setFullYear(year, month - 1, day);
  return next;
}

function formatLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function normalizeToMinute(date: Date) {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
}

function clampToMax(date: Date, maxDate: Date) {
  return date.getTime() > maxDate.getTime() ? new Date(maxDate) : date;
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
