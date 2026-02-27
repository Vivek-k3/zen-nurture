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

/**
 * Renders a three-column wheel picker for selecting a local date, hour, and minute within an allowed range.
 *
 * The component normalizes selections to minute precision, clamps them to `max` when provided, and calls
 * `onChange` only when the effective selected Date changes. It also offers a "Now" button to jump to the
 * current maximum allowed date/time.
 *
 * @param label - Visible label shown above the picker
 * @param value - Current selected Date (will be normalized to minute precision for display and comparisons)
 * @param onChange - Callback invoked with the new selected Date (normalized to minute precision and clamped to `max`) when the selection changes
 * @param max - Optional maximum allowed Date; selections later than this will be clamped to `max`
 * @param daysBack - Number of days to include before the latest selectable day when building the date column (default: 60)
 * @returns A React element containing a labeled header with a formatted preview, three WheelPicker columns (date, hour, minute), and a footer row of labels
 */
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

/**
 * Create day options for the date wheel spanning from a computed start date up to the maximum date.
 *
 * The start date is the earlier of the selected date (normalized to local day) or a window anchored `daysBack` days before `maxDate`.
 *
 * @param selectedDate - The currently selected date used to determine the earliest selectable day if it precedes the daysBack window
 * @param maxDate - The inclusive latest selectable date
 * @param daysBack - Number of days to include in the default window ending at `maxDate`
 * @returns An array of wheel options where each option's `value` is a `YYYY-MM-DD` local day key and `label` is a localized day label (e.g., "Today", "Yesterday", or a short weekday/date)
 */
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

/**
 * Builds hour options for a 24-hour wheel, labeling each hour with a two-digit string and disabling hours greater than the provided maximum.
 *
 * @param maxHour - Highest enabled hour (0–23); pass `null` to enable all hours
 * @returns An array of hour option objects for 0–23 where `label` is a two-digit string and `disabled` is `true` for hours greater than `maxHour`
 */
function buildHourOptions(maxHour: number | null): WheelPickerOption<number>[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    value: hour,
    label: pad(hour),
    disabled: maxHour !== null && hour > maxHour,
  }));
}

/**
 * Produces minute options for a wheel picker covering minutes 0 through 59.
 *
 * @param maxMinute - If a number, minutes greater than `maxMinute` are marked disabled; if `null`, no minutes are disabled
 * @returns An array of `WheelPickerOption<number>` for minutes 0–59 with `value`, `label`, and `disabled` when applicable
 */
function buildMinuteOptions(maxMinute: number | null): WheelPickerOption<number>[] {
  return Array.from({ length: 60 }, (_, minute) => ({
    value: minute,
    label: pad(minute),
    disabled: maxMinute !== null && minute > maxMinute,
  }));
}

/**
 * Produces a short, human-friendly label for a date relative to a reference date.
 *
 * @param date - The date to label.
 * @param latest - The reference date considered "today" for the comparison.
 * @returns `'Today'` if `date` is the same local day as `latest`, `'Yesterday'` if it is the day before `latest`, otherwise a localized short weekday/day/month label (e.g., "Mon, 1 Jan").
 */
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

/**
 * Create a copy of a Date whose local year, month, and day are set from a `YYYY-MM-DD` string.
 *
 * @param date - The source Date whose time (hours, minutes, seconds, ms) and timezone context are preserved
 * @param dayKey - A `YYYY-MM-DD` local day key to apply
 * @returns A new Date with year, month, and day replaced by the parsed `dayKey`, preserving the original time components
 */
function setLocalDay(date: Date, dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const next = new Date(date);
  next.setFullYear(year, month - 1, day);
  return next;
}

/**
 * Format a Date into a local day key string.
 *
 * @param date - The Date to format (interpreted in the local timezone)
 * @returns The local day key in `YYYY-MM-DD` format
 */
function formatLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Create a new Date representing the start of the given date's local day (00:00:00.000).
 *
 * @param date - The reference date whose local day start to compute
 * @returns A new Date set to 00:00:00.000 of the same local year, month, and day as `date`
 */
function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Normalize a Date to minute precision by clearing seconds and milliseconds without mutating the original.
 *
 * @param date - The source Date to normalize; the input is not modified.
 * @returns A new Date equal to `date` with seconds and milliseconds set to zero.
 */
function normalizeToMinute(date: Date) {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
}

/**
 * Clamp a date so it does not exceed a maximum allowed date.
 *
 * @returns The original `date` if it is less than or equal to `maxDate`, otherwise a new `Date` equal to `maxDate`.
 */
function clampToMax(date: Date, maxDate: Date) {
  return date.getTime() > maxDate.getTime() ? new Date(maxDate) : date;
}

/**
 * Determines whether two Date objects represent the same local calendar day.
 *
 * @param a - The first date to compare
 * @param b - The second date to compare
 * @returns `true` if `a` and `b` have the same year, month, and day in the local time zone, `false` otherwise
 */
function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Format a number as a two-digit string, adding a leading zero when necessary.
 *
 * @returns The value formatted as a two-character string; values less than 10 are prefixed with "0", larger values are returned as their full numeric string.
 */
function pad(value: number) {
  return value.toString().padStart(2, "0");
}
