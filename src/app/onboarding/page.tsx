"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { POP_CULTURE_FAMILY_NAMES } from "@/lib/family-names";

type Step = "family" | "baby";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("family");
  const [familyName, setFamilyName] = useState("");
  const [diceSpinning, setDiceSpinning] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);

  const [babyName, setBabyName] = useState("");
  const [babyDob, setBabyDob] = useState("");
  const [babyGender, setBabyGender] = useState("");
  const [babyTimezone, setBabyTimezone] = useState("Asia/Kolkata");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createFamily = useMutation(api.families.createFamily);
  const createBabyProfile = useMutation(api.events.createBabyProfile);

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
      setFamilyId(id);
      setStep("baby");
    } catch (err: any) {
      setError(err.message ?? "Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!familyId || !babyName.trim() || !babyDob) return;
    setLoading(true);
    setError("");
    try {
      await createBabyProfile({
        familyId: familyId as any,
        name: babyName.trim(),
        dob: babyDob,
        gender: babyGender || undefined,
        timezone: babyTimezone,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message ?? "Failed to create baby profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-oat px-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`h-2 rounded-full transition-all duration-300 ${step === "family" ? "w-8 bg-sage" : "w-2 bg-sage"}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step === "baby" ? "w-8 bg-sage" : "w-2 bg-muted/30"}`} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-serif font-bold text-espresso">Zen Nurture</h1>
          <p className="text-muted mt-2">
            {step === "family" ? "Let\u2019s set up your family" : "Tell us about your little one"}
          </p>
        </div>

        {/* Step 1 — Family */}
        {step === "family" && (
          <div className="bg-white rounded-[20px] p-8 shadow-sm border border-muted/10">
            <div className="text-center mb-6">
              <span className="material-symbols-outlined text-5xl text-sage">family_restroom</span>
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
        {step === "baby" && (
          <div className="bg-white rounded-[20px] p-8 shadow-sm border border-muted/10">
            <div className="text-center mb-6">
              <span className="material-symbols-outlined text-5xl text-sage">child_friendly</span>
              <h2 className="text-xl font-bold text-espresso mt-3">Add Your Baby</h2>
              <p className="text-muted text-sm mt-1">You can add more babies later in Settings.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ob-baby-name" className="text-xs font-bold text-muted uppercase tracking-wider">
                  Baby&apos;s Name
                </label>
                <input
                  id="ob-baby-name"
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
                  <label htmlFor="ob-baby-dob" className="text-xs font-bold text-muted uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <input
                    id="ob-baby-dob"
                    type="date"
                    value={babyDob}
                    onChange={(e) => setBabyDob(e.target.value)}
                    className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ob-baby-gender" className="text-xs font-bold text-muted uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    id="ob-baby-gender"
                    value={babyGender}
                    onChange={(e) => setBabyGender(e.target.value)}
                    className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="ob-baby-tz" className="text-xs font-bold text-muted uppercase tracking-wider">
                  Timezone
                </label>
                <select
                  id="ob-baby-tz"
                  value={babyTimezone}
                  onChange={(e) => setBabyTimezone(e.target.value)}
                  className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium focus:outline-none focus:border-sage/50"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              {error && (
                <div className="text-alert-red text-sm bg-alert-red/5 rounded-xl p-3 border border-alert-red/20">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("family"); setError(""); }}
                  className="flex-1 py-3 rounded-xl border border-muted/20 text-muted font-bold hover:bg-muted/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading || !babyName.trim() || !babyDob}
                  className="flex-1 py-3 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Setting up..." : "Let\u2019s Go!"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
