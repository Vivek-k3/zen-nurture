"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DIAPER_COLORS, DIAPER_TEXTURES, DEFAULT_MEDICINES, MED_OUTCOMES } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import PhotoAttacher from "@/components/PhotoAttacher";
import FormulaPicker from "@/components/FormulaPicker";
import MedicinePicker from "@/components/MedicinePicker";

interface QuickLoggerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type LogType = "menu" | "feed" | "diaper" | "sleep" | "meds" | "note" | "growth" | "pump";
type FeedSubType = "bottle" | "breast" | "pump";
type DiaperKind = "wet" | "dirty" | "dry" | "mixed";
type DiaperTexture = (typeof DIAPER_TEXTURES)[keyof typeof DIAPER_TEXTURES];
type DiaperColor = (typeof DIAPER_COLORS)[keyof typeof DIAPER_COLORS];
type BreastSide = "left" | "right" | "both";
type BottleContentType = "formula" | "breast_milk" | "cow_milk";

type LogTileProps = {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
};

function LogTile({ icon, label, color, onClick }: LogTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-${color}/20 bg-white shadow-sm`}
    >
      <div className={`h-12 w-12 rounded-full bg-${color}/10 flex items-center justify-center text-${color}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <span className="text-sm font-bold text-espresso">{label}</span>
    </button>
  );
}

const QuickLoggerDrawer: React.FC<QuickLoggerDrawerProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<LogType>("menu");
  const [feedSubType, setFeedSubType] = useState<FeedSubType>("bottle");
  const [diaperKind, setDiaperKind] = useState<DiaperKind>("wet");
  const [diaperTexture, setDiaperTexture] = useState<DiaperTexture | undefined>(undefined);
  const [diaperColor, setDiaperColor] = useState<DiaperColor | undefined>(undefined);
  const [hasBlowout, setHasBlowout] = useState(false);
  const [breastSide, setBreastSide] = useState<BreastSide>("left");
  const [hasRash, setHasRash] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(120);
  const [duration, setDuration] = useState(15);
  const [noteText, setNoteText] = useState("");
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [headCm, setHeadCm] = useState(0);
  const [sleepStart, setSleepStart] = useState("");
  const [sleepEnd, setSleepEnd] = useState("");
  const [bottleContentType, setBottleContentType] = useState<BottleContentType>("formula");
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>("");
  const [formulaCompany, setFormulaCompany] = useState("");
  const [formulaType, setFormulaType] = useState("");
  const [formulaName, setFormulaName] = useState("");
  const [medName, setMedName] = useState("");
  const [medCustomName, setMedCustomName] = useState("");
  const [medDoseValue, setMedDoseValue] = useState(1);
  const [medDoseUnit, setMedDoseUnit] = useState("ml");
  const [medOutcome, setMedOutcome] = useState<"taken" | "skipped" | "vomited">("taken");
  const [isSleepingNow, setIsSleepingNow] = useState(false);
  const [photoIds, setPhotoIds] = useState<string[]>([]);

  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const createEvent = useMutation(api.events.createEvent);
  const upsertFormula = useMutation(api.events.upsertFormula);
  const formulas = useQuery(api.events.listFormulas);
  const medicines = useQuery(api.events.listMedicines);

  const buildFormulaDisplayName = (company: string, type: string, name: string) => {
    return [company.trim(), type.trim(), name.trim()].filter(Boolean).join(" - ");
  };

  const handleSaveEvent = async () => {
    if (!babyProfile?._id) return;

    const timestamp = new Date().toISOString();
    let payload: any = {};
    let eventType = "";

    switch (view) {
      case "feed":
        if (feedSubType === "bottle") {
          let formulaPayload: Record<string, unknown> = {};

          if (bottleContentType === "formula" && formulaName) {
            await upsertFormula({ name: formulaName, notes: "" });
            formulaPayload = { formulaName };
          }

          eventType = "FEED_BOTTLE";
          payload = {
            amountMl: volume,
            contentType: bottleContentType,
            ...formulaPayload,
          };
        } else if (feedSubType === "breast") {
          eventType = "FEED_BREAST";
          payload = { side: breastSide, durationMin: duration };
        } else if (feedSubType === "pump") {
          eventType = "PUMP";
          payload = { amountMl: volume };
        }
        break;
      case "diaper":
        eventType = "DIAPER";
        payload = {
          kind: diaperKind,
          texture: diaperTexture,
          color: diaperColor,
          blowout: hasBlowout,
          rash: hasRash,
        };
        break;
      case "sleep":
        eventType = "SLEEP";
        payload = {
          startTs: isSleepingNow ? timestamp : (sleepStart ? new Date(sleepStart).toISOString() : timestamp),
          endTs: isSleepingNow ? null : (sleepEnd ? new Date(sleepEnd).toISOString() : null),
          kind: "nap",
        };
        break;
      case "meds": {
        const finalMedName = medName.trim();
        if (!finalMedName) return;
        eventType = "MED_DOSE";
        payload = {
          medicineName: finalMedName,
          doseValue: medDoseValue,
          doseUnit: medDoseUnit,
          outcome: medOutcome,
        };
        break;
      }
      case "note":
        eventType = "NOTE";
        payload = { text: noteText };
        break;
      case "growth":
        eventType = "GROWTH";
        payload = { weightKg: weight || undefined, heightCm: height || undefined, headCm: headCm || undefined };
        break;
    }

    try {
      await createEvent({
        babyId: babyProfile._id,
        type: eventType,
        timestamp,
        payload,
        source: "manual",
        ...(photoIds.length > 0 ? { photoIds } : {}),
      } as any);
      onClose();
      setView("menu");
      resetForm();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const resetForm = () => {
    setVolume(120);
    setDuration(15);
    setNoteText("");
    setWeight(0);
    setHeight(0);
    setHeadCm(0);
    setHasRash(false);
    setHasBlowout(false);
    setDiaperKind("wet");
    setDiaperTexture(undefined);
    setDiaperColor(undefined);
    setBreastSide("left");
    setSleepStart("");
    setSleepEnd("");
    setBottleContentType("formula");
    setSelectedFormulaId("");
    setFormulaCompany("");
    setFormulaType("");
    setFormulaName("");
    setMedName("");
    setMedCustomName("");
    setMedDoseValue(1);
    setMedDoseUnit("ml");
    setMedOutcome("taken");
    setIsSleepingNow(false);
    setPhotoIds([]);
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView("menu");
        resetForm();
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBack = () => {
    if (view === "menu") onClose();
    else setView("menu");
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close logger drawer"
        className="fixed inset-0 bg-espresso/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#FDFBF7] z-50 flex flex-col shadow-2xl transform transition-transform animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-muted/10 bg-white/50">
          <div className="flex items-center gap-4">
            {view !== "menu" && (
              <button
                type="button"
                onClick={handleBack}
                className="h-8 w-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-espresso transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <h2 className="text-xl font-bold text-espresso font-serif tracking-tight">
              {view === "menu" ? "Log Event" : `Log ${view.charAt(0).toUpperCase() + view.slice(1)}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted/10 flex items-center justify-center text-muted transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {view === "menu" && (
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setIsListening(!isListening)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 border transition-all ${
                  isListening
                    ? "bg-alert-red/5 border-alert-red/30 text-alert-red"
                    : "bg-white border-muted/20 text-muted hover:border-sage/50 hover:shadow-sm"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    isListening ? "bg-alert-red text-white animate-pulse" : "bg-sage/10 text-sage"
                  }`}
                >
                  <span className="material-symbols-outlined">{isListening ? "mic" : "mic_none"}</span>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold text-espresso`}>
                    {isListening ? "Listening..." : "Tap to speak"}
                  </p>
                  <p className="text-xs opacity-70">&quot;Logged 120ml milk just now&quot;</p>
                </div>
              </button>
            </div>
          )}

          {view === "menu" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                  Essentials
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <LogTile
                    icon="water_drop"
                    label="Feed"
                    color="sage"
                    onClick={() => setView("feed")}
                  />
                  <LogTile
                    icon="baby_changing_station"
                    label="Diaper"
                    color="clay"
                    onClick={() => setView("diaper")}
                  />
                  <LogTile
                    icon="bedtime"
                    label="Sleep"
                    color="night"
                    onClick={() => setView("sleep")}
                  />
                  <LogTile
                    icon="medication"
                    label="Medicine"
                    color="alert-red"
                    onClick={() => setView("meds")}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                  Growth & More
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <LogTile
                    icon="straighten"
                    label="Growth"
                    color="espresso"
                    onClick={() => setView("growth")}
                  />
                  <LogTile
                    icon="edit_note"
                    label="Note"
                    color="muted"
                    onClick={() => setView("note")}
                  />
                  <LogTile
                    icon="electric_bolt"
                    label="Pump"
                    color="dusty-blue"
                    onClick={() => { setFeedSubType("pump"); setView("feed"); }}
                  />
                </div>
              </div>
            </div>
          )}

          {view === "feed" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {feedSubType !== "pump" && (
                <div className="flex bg-oat p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFeedSubType("bottle")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      feedSubType === "bottle"
                        ? "bg-white shadow-sm text-espresso"
                        : "text-muted hover:text-espresso"
                    }`}
                  >
                    Bottle
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedSubType("breast")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      feedSubType === "breast"
                        ? "bg-white shadow-sm text-espresso"
                        : "text-muted hover:text-espresso"
                    }`}
                  >
                    Breast
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedSubType("pump")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      (feedSubType as string) === "pump"
                        ? "bg-white shadow-sm text-espresso"
                        : "text-muted hover:text-espresso"
                    }`}
                  >
                    Pump
                  </button>
                </div>
              )}

              {feedSubType === "bottle" && (
                <>
                  <div className="bg-white rounded-3xl p-6 border border-muted/10 text-center space-y-4 shadow-sm">
                    <div className="text-5xl font-mono font-bold text-espresso tracking-tighter">
                      {volume}
                      <span className="text-lg text-muted ml-1">ml</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="10"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full accent-sage"
                    />
                    <div className="flex justify-center gap-2 pt-2">
                      {[60, 90, 120, 150, 180].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVolume(v)}
                          className="px-3 py-1 rounded-full bg-oat text-xs font-bold text-muted hover:bg-sage/10 hover:text-sage transition-colors"
                        >
                          {v}ml
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="contents" className="text-xs font-bold text-muted uppercase tracking-wider">
                      Contents
                    </label>
                    <select
                      id="contents"
                      value={bottleContentType}
                      onChange={(e) => setBottleContentType(e.target.value as BottleContentType)}
                      className="w-full p-4 rounded-xl bg-white border border-muted/10 text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-sage/20"
                    >
                      <option value="formula">Formula</option>
                      <option value="breast_milk">Breast Milk (Pumped)</option>
                      <option value="cow_milk">Cow Milk</option>
                    </select>
                  </div>

                  {bottleContentType === "formula" && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">
                        Formula
                      </label>
                      <FormulaPicker
                        value={formulaName}
                        onChange={(name) => {
                          setFormulaName(name);
                          setSelectedFormulaId("");
                        }}
                        savedFormulas={formulas ?? []}
                      />
                    </div>
                  )}
                </>
              )}

              {feedSubType === "breast" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {(["left", "right", "both"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => setBreastSide(side)}
                        className={`py-4 rounded-2xl text-sm font-bold transition-all ${
                          breastSide === side
                            ? "bg-sage text-white shadow-md"
                            : "bg-white text-muted border border-muted/10 hover:border-sage/30"
                        }`}
                      >
                        {side.charAt(0).toUpperCase() + side.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-muted/10 text-center space-y-4 shadow-sm">
                    <div className="text-5xl font-mono font-bold text-espresso tracking-tighter">
                      {duration}
                      <span className="text-lg text-muted ml-1">min</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full accent-sage"
                    />
                    <div className="flex justify-center gap-2 pt-2">
                      {[5, 10, 15, 20, 30].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setDuration(v)}
                          className="px-3 py-1 rounded-full bg-oat text-xs font-bold text-muted hover:bg-sage/10 hover:text-sage transition-colors"
                        >
                          {v}m
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {feedSubType === "pump" && (
                <div className="bg-white rounded-3xl p-6 border border-muted/10 text-center space-y-4 shadow-sm">
                  <div className="text-5xl font-mono font-bold text-espresso tracking-tighter">
                    {volume}
                    <span className="text-lg text-muted ml-1">ml</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="10"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full accent-dusty-blue"
                  />
                  <div className="flex justify-center gap-2 pt-2">
                    {[30, 60, 90, 120, 150].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVolume(v)}
                        className="px-3 py-1 rounded-full bg-oat text-xs font-bold text-muted hover:bg-dusty-blue/10 hover:text-dusty-blue transition-colors"
                      >
                        {v}ml
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "diaper" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-center gap-4">
                {(["wet", "dirty", "dry"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setDiaperKind(kind)}
                    aria-pressed={diaperKind === kind}
                    className={`h-24 w-24 rounded-full border-2 transition-all shadow-sm flex items-center justify-center text-2xl font-semibold capitalize ${
                      diaperKind === kind
                        ? "bg-sage border-sage text-white"
                        : "bg-transparent border-sage text-sage hover:bg-sage/10"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-muted/10 space-y-4">
                <h4 className="text-xl font-serif text-espresso">Texture &amp; Color</h4>

                <div className="grid grid-cols-5 gap-3">
                  {(["runny", "mucousy", "mushy", "solid", "pebbles"] as const).map((texture) => (
                    <button
                      key={texture}
                      type="button"
                      onClick={() => setDiaperTexture(texture)}
                      aria-pressed={diaperTexture === texture}
                      className={`rounded-xl p-2 border text-xs font-semibold capitalize transition-colors ${
                        diaperTexture === texture
                          ? "border-sage bg-sage/10 text-sage"
                          : "border-muted/30 text-muted hover:border-sage/40"
                      }`}
                    >
                      {texture}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-6 gap-3">
                  {(["black", "green", "yellow", "brown", "red", "gray"] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDiaperColor(color)}
                      aria-pressed={diaperColor === color}
                      className={`rounded-xl p-2 border text-xs font-semibold capitalize transition-colors ${
                        diaperColor === color
                          ? "border-sage bg-sage/10 text-sage"
                          : "border-muted/30 text-muted hover:border-sage/40"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-muted/10 divide-y divide-muted/10">
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-base font-medium text-espresso">Blowout</span>
                    <p className="text-xs text-muted mt-0.5">Leaked outside diaper</p>
                  </div>
                  <Switch checked={hasBlowout} onCheckedChange={setHasBlowout} />
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-base font-medium text-espresso">Diaper Rash</span>
                    <p className="text-xs text-muted mt-0.5">Redness or irritation</p>
                  </div>
                  <Switch checked={hasRash} onCheckedChange={setHasRash} />
                </div>
              </div>
            </div>
          )}

          {view === "sleep" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Sleeping now toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSleepingNow(!isSleepingNow);
                  if (!isSleepingNow) {
                    setSleepStart("");
                    setSleepEnd("");
                  }
                }}
                className={`w-full py-5 rounded-2xl flex flex-col items-center gap-2 transition-all border ${
                  isSleepingNow
                    ? "bg-night/10 border-night/30 text-night"
                    : "bg-white border-muted/10 text-muted hover:border-night/20"
                }`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {isSleepingNow ? "bedtime" : "bedtime_off"}
                </span>
                <span className="font-bold text-lg text-espresso">
                  {isSleepingNow ? "Baby is sleeping..." : "Tap to start sleep"}
                </span>
                {isSleepingNow && (
                  <span className="text-sm text-night/70">Sleep started now. Tap Save to log.</span>
                )}
              </button>

              {!isSleepingNow && (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-px flex-1 bg-muted/15" />
                    <span className="text-[11px] text-muted font-bold uppercase">or log past sleep</span>
                    <div className="h-px flex-1 bg-muted/15" />
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 border border-muted/10">
                      <label htmlFor="sleep-start" className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                        Sleep Start
                      </label>
                      <input
                        id="sleep-start"
                        type="datetime-local"
                        value={sleepStart}
                        onChange={(e) => setSleepStart(e.target.value)}
                        className="w-full p-3 rounded-xl bg-oat/50 text-espresso font-mono text-lg focus:outline-none focus:ring-2 focus:ring-night/20"
                      />
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-muted/10">
                      <label htmlFor="sleep-end" className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                        Woke Up
                      </label>
                      <input
                        id="sleep-end"
                        type="datetime-local"
                        value={sleepEnd}
                        onChange={(e) => setSleepEnd(e.target.value)}
                        className="w-full p-3 rounded-xl bg-oat/50 text-espresso font-mono text-lg focus:outline-none focus:ring-2 focus:ring-night/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[
                      { label: "30min nap", mins: 30 },
                      { label: "1hr nap", mins: 60 },
                      { label: "2hr nap", mins: 120 },
                    ].map(({ label, mins }) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const start = new Date(now.getTime() - mins * 60 * 1000);
                          setSleepStart(start.toISOString().slice(0, 16));
                          setSleepEnd(now.toISOString().slice(0, 16));
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-night/5 text-night text-sm font-medium hover:bg-night/10 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {view === "meds" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Medicine</label>
                <MedicinePicker
                  value={medName === "__custom__" ? medCustomName : medName}
                  onChange={(name) => {
                    setMedName(name);
                    setMedCustomName("");
                  }}
                />
              </div>

              <div className="bg-white rounded-2xl p-5 border border-muted/10 space-y-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label htmlFor="med-dose" className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                      Dose
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="med-dose"
                        type="number"
                        value={medDoseValue || ""}
                        onChange={(e) => setMedDoseValue(Number(e.target.value))}
                        min={0}
                        step={0.5}
                        className="w-24 p-3 rounded-xl bg-oat/50 text-espresso font-mono text-lg text-center focus:outline-none focus:ring-2 focus:ring-alert-red/20"
                      />
                      <select
                        value={medDoseUnit}
                        onChange={(e) => setMedDoseUnit(e.target.value)}
                        className="p-3 rounded-xl bg-oat/50 text-espresso font-medium focus:outline-none"
                      >
                        <option value="ml">ml</option>
                        <option value="drops">drops</option>
                        <option value="tablet">tablet</option>
                        <option value="tsp">tsp</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Outcome</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: "taken", icon: "check_circle", label: "Taken", color: "sage" },
                    { key: "skipped", icon: "cancel", label: "Skipped", color: "muted" },
                    { key: "vomited", icon: "warning", label: "Vomited", color: "alert-red" },
                  ] as const).map(({ key, icon, label, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMedOutcome(key)}
                      className={`py-4 rounded-2xl flex flex-col items-center gap-1 text-sm font-bold transition-all ${
                        medOutcome === key
                          ? `bg-${color}/10 border-${color}/30 border text-${color}`
                          : "bg-white border border-muted/10 text-muted hover:border-muted/30"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${medOutcome === key ? `text-${color}` : ""}`}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === "note" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="w-full h-40 p-4 rounded-2xl bg-white border border-muted/10 text-espresso font-medium resize-none focus:outline-none focus:ring-2 focus:ring-sage/20"
              />
            </div>
          )}

          {view === "growth" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-2xl p-4 border border-muted/10">
                <label htmlFor="growth-weight" className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                  Weight (kg)
                </label>
                <input
                  id="growth-weight"
                  type="number"
                  value={weight || ""}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full p-3 rounded-xl bg-oat/50 text-espresso font-mono text-lg focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>

              <div className="bg-white rounded-2xl p-4 border border-muted/10">
                <label htmlFor="growth-height" className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                  Height / Length (cm)
                </label>
                <input
                  id="growth-height"
                  type="number"
                  value={height || ""}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full p-3 rounded-xl bg-oat/50 text-espresso font-mono text-lg focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>

              <div className="bg-white rounded-2xl p-4 border border-muted/10">
                <label htmlFor="growth-head" className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                  Head Circumference (cm)
                </label>
                <input
                  id="growth-head"
                  type="number"
                  value={headCm || ""}
                  onChange={(e) => setHeadCm(Number(e.target.value))}
                  placeholder="0.0"
                  step="0.1"
                  className="w-full p-3 rounded-xl bg-oat/50 text-espresso font-mono text-lg focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>
            </div>
          )}
        </div>

        {view !== "menu" && (
          <div className="p-6 border-t border-muted/10 bg-white/80 backdrop-blur-md space-y-3">
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Photos (optional)</p>
              <PhotoAttacher storageIds={photoIds} onChange={setPhotoIds} />
            </div>
            <button
              type="button"
              onClick={handleSaveEvent}
              className="w-full h-14 bg-espresso text-oat rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-espresso/90 active:scale-[0.99] transition-all shadow-lg shadow-espresso/10"
            >
              <span className="material-symbols-outlined">check</span>
              Save Entry
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default QuickLoggerDrawer;
