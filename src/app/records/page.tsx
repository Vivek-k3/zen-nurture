"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS, normalizeEventType } from "@/lib/constants";
import { formatTime } from "@/lib/time";
import {
  buildRecordDetailRows,
  buildRecordPayloadForSave,
  createRecordEditState,
  getRecordEventDetail,
  groupTimelineEventsByDate,
} from "@/lib/record-event-details";
import EventPhotos from "@/components/EventPhotos";
import FormulaPicker from "@/components/FormulaPicker";
import MedicinePicker from "@/components/MedicinePicker";
import DateTimeWheelPicker from "@/components/DateTimeWheelPicker";
import { DataState } from "@/components/DataState";
import { useBaby } from "@/components/BabyContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AppSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TypeFilter = "all" | string;
type TimelineEvent = any;

const DIAPER_KINDS = ["wet", "dirty", "dry", "mixed"] as const;
const DIAPER_TEXTURES = ["runny", "mucousy", "mushy", "solid", "pebbles"] as const;
const DIAPER_COLORS = ["black", "green", "yellow", "brown", "red", "gray"] as const;
const BREAST_SIDES = ["left", "right", "both"] as const;
const BOTTLE_TYPES = ["formula", "breast_milk", "cow_milk"] as const;
const MED_DOSE_UNITS = ["ml", "drops", "tablet", "tsp"] as const;
const MED_OUTCOMES = ["taken", "skipped", "vomited"] as const;

export default function RecordsPage() {
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const { activeBaby: babyProfile, activeBabyId: babyId } = useBaby();

  useEffect(() => {
    setMounted(true);
  }, []);

  const events = useQuery(
    api.events.listTimeline,
    babyId
      ? { babyId, limit: 100, ...(typeFilter !== "all" ? { type: typeFilter } : {}) }
      : "skip"
  );

  if (!mounted) return null;

  const grouped = groupTimelineEventsByDate(events ?? []);

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-espresso">Timeline</h1>
        <p className="text-muted text-sm mt-1">All events logged for {babyProfile?.name ?? "baby"}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <FilterChip label="All" active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
        {["FEED_BOTTLE", "FEED_BREAST", "DIAPER", "SLEEP", "MED_DOSE", "NOTE", "GROWTH"].map((type) => (
          <FilterChip
            key={type}
            label={EVENT_TYPE_LABELS[type] ?? type}
            active={typeFilter === type}
            onClick={() => setTypeFilter(type)}
          />
        ))}
      </div>

      {!babyProfile ? (
        <EmptyState icon="child_friendly" title="No baby profile" subtitle="Add your baby in Settings first" />
      ) : (
        <DataState
          value={events}
          loadingFallback={
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-muted/10 flex gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-muted/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded-full bg-muted/10" />
                    <div className="h-3 w-48 rounded-full bg-muted/10" />
                  </div>
                </div>
              ))}
            </div>
          }
          emptyFallback={
            <EmptyState icon="timeline" title="No events yet" subtitle="Log your first event using the + button" />
          }
        >
          {() => (
            <div className="space-y-6">
              {grouped.map(({ label, events: dayEvents }) => (
                <div key={label}>
                  <div className="sticky top-0 z-10 bg-oat/90 backdrop-blur-sm py-2 px-1">
                    <h2 className="text-xs font-bold text-muted uppercase tracking-wider">{label}</h2>
                  </div>
                  <div className="space-y-2">
                    {dayEvents.map((event: TimelineEvent) => (
                      <TimelineCard key={event._id} event={event} onOpen={() => setSelectedEvent(event)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataState>
      )}

      <EventDetailDialog
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </div>
  );
}

function TimelineCard({ event, onOpen }: { event: TimelineEvent; onOpen: () => void }) {
  const type = normalizeEventType(event.type);
  const icon = EVENT_TYPE_ICONS[type] ?? "event";
  const color = EVENT_TYPE_COLORS[type] ?? "muted";
  const label = EVENT_TYPE_LABELS[type] ?? type;
  const payload = event.payload ?? {};
  const detail = getRecordEventDetail(type, payload);
  const loggedBy = event.loggedByName;
  const source = event.source;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-muted/10 flex gap-3 transition-all hover:border-sage/25 hover:shadow-md"
    >
      <div className={`h-10 w-10 shrink-0 rounded-xl bg-${color}/10 flex items-center justify-center`}>
        <span className={`material-symbols-outlined text-${color} text-xl`}>{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-espresso text-sm">{label}</h3>
          <span className="text-[11px] text-muted font-mono shrink-0">{formatTime(event.timestamp)}</span>
        </div>

        {detail && <p className="text-xs text-muted mt-0.5 truncate">{detail}</p>}

        {event.photoIds?.length > 0 && (
          <div className="mt-2 pointer-events-none">
            <EventPhotos storageIds={event.photoIds} />
          </div>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {loggedBy && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted bg-oat/60 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[12px]">person</span>
              {loggedBy}
            </span>
          )}
          {source === "mora" ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-sage bg-sage/8 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[12px]">smart_toy</span>
              via Mora
            </span>
          ) : source && source !== "manual" ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-sage bg-sage/8 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[12px]">smart_toy</span>
              {source}
            </span>
          ) : null}
          <span className="ml-auto text-[11px] text-muted">View details</span>
        </div>
      </div>
    </button>
  );
}

function EventDetailDialog({
  event,
  open,
  onOpenChange,
}: {
  event: TimelineEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const updateEvent = useMutation(api.events.updateEvent);
  const formulas = useQuery(api.events.listFormulas, {});

  useEffect(() => {
    if (event) {
      setForm(createRecordEditState(event));
      setIsEditing(false);
    }
  }, [event]);

  if (!event || !form) return null;

  const payload = event.payload ?? {};
  const type = normalizeEventType(event.type);
  const label = EVENT_TYPE_LABELS[type] ?? type;
  const icon = EVENT_TYPE_ICONS[type] ?? "event";
  const color = EVENT_TYPE_COLORS[type] ?? "muted";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEvent({
        id: event._id,
        timestamp: form.timestamp.toISOString(),
        payload: buildRecordPayloadForSave(type, form),
      } as any);
      setIsEditing(false);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[28px] border-muted/10 bg-[#fefcf8] p-0 overflow-hidden">
        <div className="border-b border-muted/10 bg-white/80 p-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-2xl bg-${color}/10 flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-${color} text-2xl`}>{icon}</span>
                </div>
                <div>
                  <DialogTitle className="text-xl font-serif text-espresso">{label}</DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-muted">
                    Logged {new Date(event.timestamp).toLocaleString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </DialogDescription>
                </div>
              </div>
              <Button
                type="button"
                variant={isEditing ? "secondary" : "outline"}
                onClick={() => {
                  if (isEditing) {
                    setForm(createRecordEditState(event));
                    setIsEditing(false);
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="rounded-full"
              >
                <span className="material-symbols-outlined text-[16px]">{isEditing ? "close" : "edit"}</span>
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            <>
              <DateTimeWheelPicker
                label="Event time"
                value={form.timestamp}
                onChange={(value) => setForm((current: any) => ({ ...current, timestamp: value }))}
              />
              <EditableFields
                type={type}
                form={form}
                setForm={setForm}
                formulas={formulas ?? []}
              />
            </>
          ) : (
            <>
              <DetailSection title="Summary">
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Time" value={formatTime(event.timestamp)} />
                  <DetailRow label="Date" value={new Date(event.timestamp).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })} />
                  {event.loggedByName ? <DetailRow label="Logged by" value={event.loggedByName} /> : null}
                  {event.source ? <DetailRow label="Source" value={event.source} /> : null}
                </div>
              </DetailSection>

              <DetailSection title="Details">
                <DetailGrid type={type} payload={payload} />
              </DetailSection>

              {event.photoIds?.length > 0 ? (
                <DetailSection title="Photos">
                  <EventPhotos storageIds={event.photoIds} />
                </DetailSection>
              ) : null}
            </>
          )}
        </div>

        {isEditing ? (
          <DialogFooter className="border-t border-muted/10 bg-white/80 p-6">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-full">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving} className="rounded-full bg-espresso text-oat hover:bg-espresso/90">
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditableFields({
  type,
  form,
  setForm,
  formulas,
}: {
  type: string;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  formulas: Array<{ _id: string; name: string }>;
}) {
  switch (type) {
    case "FEED_BOTTLE":
      return (
        <div className="space-y-4">
          <NumberField id="record-amount" label="Amount (ml)" value={form.amountMl} onChange={(value) => setForm((current: any) => ({ ...current, amountMl: value }))} />
          <div className="space-y-2">
            <label htmlFor="record-content" className="text-xs font-bold text-muted uppercase tracking-wider">Content</label>
            <Select value={form.contentType} onValueChange={(value) => setForm((current: any) => ({ ...current, contentType: value, formulaName: value === "formula" ? current.formulaName : "" }))}>
              <AppSelectTrigger id="record-content">
                <SelectValue />
              </AppSelectTrigger>
              <SelectContent>
                {BOTTLE_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.contentType === "formula" ? (
            <div className="space-y-2">
              <label htmlFor="record-formula" className="text-xs font-bold text-muted uppercase tracking-wider">Formula</label>
              <div id="record-formula">
              <FormulaPicker
                value={form.formulaName}
                onChange={(formulaName) => setForm((current: any) => ({ ...current, formulaName }))}
                savedFormulas={formulas}
              />
              </div>
            </div>
          ) : null}
        </div>
      );
    case "FEED_BREAST":
      return (
        <div className="grid grid-cols-2 gap-4">
          <NumberField id="record-duration" label="Duration (min)" value={form.durationMin} onChange={(value) => setForm((current: any) => ({ ...current, durationMin: value }))} />
          <div className="space-y-2">
            <label htmlFor="record-side" className="text-xs font-bold text-muted uppercase tracking-wider">Side</label>
            <Select value={form.side} onValueChange={(value) => setForm((current: any) => ({ ...current, side: value }))}>
              <AppSelectTrigger id="record-side">
                <SelectValue />
              </AppSelectTrigger>
              <SelectContent>
                {BREAST_SIDES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    case "DIAPER":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <SelectField id="record-kind" label="Kind" value={form.kind} options={DIAPER_KINDS} onChange={(value) => setForm((current: any) => ({ ...current, kind: value }))} />
            <SelectField id="record-texture" label="Texture" value={form.texture} options={DIAPER_TEXTURES} onChange={(value) => setForm((current: any) => ({ ...current, texture: value }))} />
            <SelectField id="record-color" label="Color" value={form.color} options={DIAPER_COLORS} onChange={(value) => setForm((current: any) => ({ ...current, color: value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ToggleField label="Blowout" checked={form.blowout} onChange={(checked) => setForm((current: any) => ({ ...current, blowout: checked }))} />
            <ToggleField label="Rash" checked={form.rash} onChange={(checked) => setForm((current: any) => ({ ...current, rash: checked }))} />
          </div>
        </div>
      );
    case "SLEEP":
      return (
        <div className="space-y-4">
          <DateTimeWheelPicker
            label="Sleep start"
            value={form.startTs}
            onChange={(value) => setForm((current: any) => ({ ...current, startTs: value, timestamp: value }))}
          />
          <DateTimeWheelPicker
            label="Sleep end"
            value={form.endTs}
            onChange={(value) => setForm((current: any) => ({ ...current, endTs: value }))}
          />
        </div>
      );
    case "MED_DOSE":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="record-medicine" className="text-xs font-bold text-muted uppercase tracking-wider">Medicine</label>
            <div id="record-medicine">
            <MedicinePicker value={form.medicineName} onChange={(medicineName) => setForm((current: any) => ({ ...current, medicineName }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <NumberField id="record-dose" label="Dose" value={form.doseValue} onChange={(value) => setForm((current: any) => ({ ...current, doseValue: value }))} />
            <SelectField id="record-dose-unit" label="Unit" value={form.doseUnit} options={MED_DOSE_UNITS} onChange={(value) => setForm((current: any) => ({ ...current, doseUnit: value }))} />
            <SelectField id="record-outcome" label="Outcome" value={form.outcome} options={MED_OUTCOMES} onChange={(value) => setForm((current: any) => ({ ...current, outcome: value }))} />
          </div>
        </div>
      );
    case "NOTE":
      return (
        <div className="space-y-2">
          <label htmlFor="record-note" className="text-xs font-bold text-muted uppercase tracking-wider">Note</label>
          <Textarea
            id="record-note"
            value={form.text}
            onChange={(event) => setForm((current: any) => ({ ...current, text: event.target.value }))}
            rows={6}
          />
        </div>
      );
    case "GROWTH":
      return (
        <div className="grid grid-cols-3 gap-4">
          <NumberField id="record-weight" label="Weight (kg)" value={form.weightKg} step="0.01" onChange={(value) => setForm((current: any) => ({ ...current, weightKg: value }))} />
          <NumberField id="record-height" label="Height (cm)" value={form.heightCm} step="0.1" onChange={(value) => setForm((current: any) => ({ ...current, heightCm: value }))} />
          <NumberField id="record-head" label="Head (cm)" value={form.headCm} step="0.1" onChange={(value) => setForm((current: any) => ({ ...current, headCm: value }))} />
        </div>
      );
    default:
      return <p className="text-sm text-muted">Editing for this event type is not available yet.</p>;
  }
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
  id,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  step?: string;
  id?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
      <input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue === "" ? "" : Number(nextValue));
        }}
        className="w-full rounded-2xl border border-muted/15 bg-white px-4 py-3 text-sm text-espresso outline-none focus:border-sage/40 focus:ring-2 focus:ring-sage/15"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  id,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <AppSelectTrigger id={id}>
          <SelectValue />
        </AppSelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
        checked ? "border-sage/30 bg-sage/8 text-espresso" : "border-muted/10 bg-white text-muted"
      }`}
    >
      <div className="text-xs font-bold uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-sm font-medium">{checked ? "Yes" : "No"}</div>
    </button>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

function DetailGrid({ type, payload }: { type: string; payload: any }) {
  const rows = buildRecordDetailRows(type, payload);
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No additional details captured.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-muted/10 bg-white/80 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-1 text-sm font-medium text-espresso break-words">{value}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        active ? "bg-espresso text-oat" : "bg-white text-muted border border-muted/10 hover:border-muted/30"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
      <span className="material-symbols-outlined text-5xl text-muted/30 mb-4">{icon}</span>
      <h3 className="text-xl font-bold text-espresso mb-2">{title}</h3>
      <p className="text-muted">{subtitle}</p>
    </div>
  );
}
