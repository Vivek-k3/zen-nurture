"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { POP_CULTURE_FAMILY_NAMES } from "@/lib/family-names";
import { useGenderThemeType } from "@/components/GenderTheme";
import Link from "next/link";
import {
  AppSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type Step = "family" | "baby";
const UNSPECIFIED_GENDER_VALUE = "unspecified";

export default function AddBabyPage() {
  const router = useRouter();
  const families = useQuery(api.families.listMyFamilies, {});
  const currentFamily = families?.[0];
  const familyId = currentFamily?._id;

  const [step, setStep] = useState<Step>("family");
  const [familyName, setFamilyName] = useState("");
  const [diceSpinning, setDiceSpinning] = useState(false);
  const [resolvedFamilyId, setResolvedFamilyId] = useState<Id<"families"> | null>(null);

  const [babyName, setBabyName] = useState("");
  const [babyDob, setBabyDob] = useState("");
  const [babyGender, setBabyGender] = useState("");
  const [babyTimezone, setBabyTimezone] = useState("Asia/Kolkata");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const genderTheme = useGenderThemeType();

  const createFamily = useMutation(api.families.createFamily);
  const createBabyProfile = useMutation(api.events.createBabyProfile);

  useEffect(() => {
    if (familyId) {
      setResolvedFamilyId(familyId);
      setStep("baby");
    }
  }, [familyId]);

  const rollFamilyName = () => {
    setDiceSpinning(true);
    let count = 0;
    const total = 12 + Math.floor(Math.random() * 6);
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * POP_CULTURE_FAMILY_NAMES.length);
      setFamilyName(POP_CULTURE_FAMILY_NAMES[idx]);
      count++;
      if (count >= total) {
        clearInterval(interval);
        setDiceSpinning(false);
      }
    }, 80);
  };

  const handleFamilyNext = async () => {
    if (!familyName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const id = await createFamily({ name: familyName.trim() });
      setResolvedFamilyId(id);
      setStep("baby");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    const fid = resolvedFamilyId ?? familyId;
    if (!fid || !babyName.trim() || !babyDob) return;
    setLoading(true);
    setError("");
    try {
      await createBabyProfile({
        familyId: fid,
        name: babyName.trim(),
        dob: babyDob,
        gender: babyGender || undefined,
        timezone: babyTimezone,
      });
      router.push("/");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to create baby profile");
    } finally {
      setLoading(false);
    }
  };

  const getThemeTextClass = () => {
    if (genderTheme === "baby-boy") return "text-baby-blue";
    if (genderTheme === "baby-girl") return "text-baby-pink";
    return "text-sage";
  };
  const themeTextClass = getThemeTextClass();

  const getThemeBgClass = () => {
    if (genderTheme === "baby-boy") return "bg-baby-blue";
    if (genderTheme === "baby-girl") return "bg-baby-pink";
    return "bg-sage";
  };
  const themeBgClass = getThemeBgClass();

  const effectiveFamilyId = resolvedFamilyId ?? familyId;
  const showFamilyStep = step === "family" || !effectiveFamilyId;

  if (families === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress dots - only when both steps possible */}
        {!familyId && (
          <div className="flex justify-center gap-2 mb-8">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${showFamilyStep ? themeBgClass : themeBgClass + "/50"}`}
              style={{ width: showFamilyStep ? "2rem" : "0.5rem" }}
            />
            <div
              className={`h-2 rounded-full transition-all duration-300 ${!showFamilyStep ? themeBgClass : "bg-muted/30"}`}
              style={{ width: !showFamilyStep ? "2rem" : "0.5rem" }}
            />
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif font-bold text-espresso">Add Baby</h1>
          <p className="text-muted mt-2">
            {showFamilyStep ? "Create a family first" : "Tell us about your little one"}
          </p>
        </div>

        {/* Step 1 — Family (only if no family yet) */}
        {showFamilyStep && (
          <div className="bg-white rounded-[20px] p-8 shadow-sm border border-muted/10">
            <div className="text-center mb-6">
              <span className={`material-symbols-outlined text-5xl ${themeTextClass}`}>family_restroom</span>
              <h2 className="text-xl font-bold text-espresso mt-3">Name Your Family</h2>
              <p className="text-muted text-sm mt-1">
                This is your shared space — caregivers you invite will join here.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. The Sharmas"
                  className="flex-1 p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleFamilyNext()}
                />
                <button
                  type="button"
                  onClick={rollFamilyName}
                  disabled={diceSpinning}
                  title="Random family name"
                  className={`h-12 w-12 shrink-0 rounded-xl bg-clay/10 border border-clay/20 flex items-center justify-center text-clay hover:bg-clay/20 transition-all ${diceSpinning ? "animate-spin" : ""}`}
                >
                  <span className="material-symbols-outlined text-[22px]">casino</span>
                </button>
              </div>

              {error && (
                <div className="text-alert-red text-sm bg-alert-red/5 rounded-xl p-3 border border-alert-red/20">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleFamilyNext}
                disabled={loading || !familyName.trim()}
                className="w-full py-3 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Baby */}
        {!showFamilyStep && (
          <div className="bg-white rounded-[20px] p-8 shadow-sm border border-muted/10">
            <div className="text-center mb-6">
              <span className={`material-symbols-outlined text-5xl ${themeTextClass}`}>child_friendly</span>
              <h2 className="text-xl font-bold text-espresso mt-3">Add Your Baby</h2>
              <p className="text-muted text-sm mt-1">You can add more babies later from the sidebar.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="add-baby-name" className="text-xs font-bold text-muted uppercase tracking-wider">
                  Baby&apos;s Name
                </label>
                <input
                  id="add-baby-name"
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                  placeholder="e.g. Aarav"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="add-baby-dob" className="text-xs font-bold text-muted uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <input
                    id="add-baby-dob"
                    type="date"
                    value={babyDob}
                    onChange={(e) => setBabyDob(e.target.value)}
                    className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="add-baby-gender" className="text-xs font-bold text-muted uppercase tracking-wider">
                    Gender
                  </label>
                  <Select
                    value={babyGender || UNSPECIFIED_GENDER_VALUE}
                    onValueChange={(value) =>
                      setBabyGender(value === UNSPECIFIED_GENDER_VALUE ? "" : value)
                    }
                  >
                    <AppSelectTrigger id="add-baby-gender">
                      <SelectValue placeholder="Not specified" />
                    </AppSelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSPECIFIED_GENDER_VALUE}>Not specified</SelectItem>
                      <SelectItem value="baby-boy">Baby Boy</SelectItem>
                      <SelectItem value="baby-girl">Baby Girl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="add-baby-tz" className="text-xs font-bold text-muted uppercase tracking-wider">
                  Timezone
                </label>
                <Select value={babyTimezone} onValueChange={setBabyTimezone}>
                  <AppSelectTrigger id="add-baby-tz">
                    <SelectValue />
                  </AppSelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="text-alert-red text-sm bg-alert-red/5 rounded-xl p-3 border border-alert-red/20">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                {!familyId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("family");
                      setError("");
                    }}
                    className="flex-1 py-3 rounded-xl border border-muted/20 text-muted font-bold hover:bg-muted/5"
                  >
                    Back
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="flex-1 py-3 rounded-xl border border-muted/20 text-muted font-bold hover:bg-muted/5 text-center"
                  >
                    Cancel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading || !babyName.trim() || !babyDob}
                  className="flex-1 py-3 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Baby"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
