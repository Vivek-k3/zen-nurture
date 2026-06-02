"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CAREGIVER_COLORS } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";
import { POP_CULTURE_FAMILY_NAMES } from "@/lib/family-names";
import { Switch } from "@/components/ui/switch";
import {
  AppSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTheme } from "@/components/ThemeContext";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [babyForm, setBabyForm] = useState({
    name: "",
    dob: "",
    gender: "",
    timezone: "Asia/Kolkata",
    volumeUnit: "ml",
    weightUnit: "kg",
    lengthUnit: "cm",
  });
  const [caregiverForm, setCaregiverForm] = useState({
    displayName: "",
    color: CAREGIVER_COLORS[0],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [moraSaving, setMoraSaving] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [diceSpinning, setDiceSpinning] = useState(false);
  const ensuredOwnerCaregiverForBaby = useRef<string | null>(null);
  const push = usePushNotifications();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: session } = authClient.useSession();
  const families = useQuery(api.families.listMyFamilies, {});
  const babyProfile = useQuery(api.events.getBabyProfile, {});
  // Scope the family section to the active baby's family (not just families[0]).
  const currentFamily =
    families?.find((f) => f?._id === babyProfile?.familyId) ?? families?.[0];
  const familyId = currentFamily?._id;

  const familyMembers = useQuery(
    api.families.listFamilyMembers,
    familyId ? { familyId } : "skip"
  );
  const pendingInvitations = useQuery(
    api.families.listPendingInvitations,
    familyId ? { familyId } : "skip"
  );
  const myInvitations = useQuery(api.families.listMyInvitations, {});

  const babyId = babyProfile?._id;
  const exportDataQuery = useQuery(api.events.exportBabyData, babyId ? { babyId } : "skip");
  const caregivers = useQuery(api.events.listCaregivers, babyId ? { babyId } : "skip");

  const createFamily = useMutation(api.families.createFamily);
  const inviteCaregiver = useMutation(api.families.inviteCaregiver);
  const acceptInvitation = useMutation(api.families.acceptInvitation);
  const declineInvitation = useMutation(api.families.declineInvitation);
  const removeMember = useMutation(api.families.removeFamilyMember);

  const createBabyProfile = useMutation(api.events.createBabyProfile);
  const updateBabyProfile = useMutation(api.events.updateBabyProfile);
  const createCaregiver = useMutation(api.events.createCaregiver);
  const ensureOwnerCaregiver = useMutation(api.events.ensureOwnerCaregiver);
  const deleteCaregiver = useMutation(api.events.deleteCaregiver);

  const clearData = useMutation(api.events.clearBabyData);
  const moraSettings = useQuery(api.mora.getMoraSettings, {});
  const updateMoraSettings = useMutation(api.mora.updateMoraSettings);

  useEffect(() => {
    if (babyProfile) {
      const nextForm = {
        name: babyProfile.name || "",
        dob: babyProfile.dob || "",
        gender: babyProfile.gender || "",
        timezone: babyProfile.timezone || "Asia/Kolkata",
        volumeUnit: babyProfile.measurementUnits?.volume || "ml",
        weightUnit: babyProfile.measurementUnits?.weight || "kg",
        lengthUnit: babyProfile.measurementUnits?.length || "cm",
      };

      setBabyForm((prev) => {
        if (
          prev.name === nextForm.name &&
          prev.dob === nextForm.dob &&
          prev.gender === nextForm.gender &&
          prev.timezone === nextForm.timezone &&
          prev.volumeUnit === nextForm.volumeUnit &&
          prev.weightUnit === nextForm.weightUnit &&
          prev.lengthUnit === nextForm.lengthUnit
        ) {
          return prev;
        }
        return nextForm;
      });
    }
  }, [babyProfile]);

  useEffect(() => {
    if (!babyId) {
      ensuredOwnerCaregiverForBaby.current = null;
      return;
    }

    const babyKey = String(babyId);
    if (ensuredOwnerCaregiverForBaby.current === babyKey) return;

    ensuredOwnerCaregiverForBaby.current = babyKey;
    void ensureOwnerCaregiver({ babyId }).catch(() => {
      ensuredOwnerCaregiverForBaby.current = null;
    });
  }, [babyId, ensureOwnerCaregiver]);

  useEffect(() => {
    if (!caregivers || caregiverForm.displayName) return;

    const usedColors = new Set(caregivers.map((caregiver: any) => caregiver.color));
    const nextColor = CAREGIVER_COLORS.find((color) => !usedColors.has(color)) ?? CAREGIVER_COLORS[0];

    if (caregiverForm.color !== nextColor) {
      setCaregiverForm((prev) => ({ ...prev, color: nextColor }));
    }
  }, [caregivers, caregiverForm.displayName, caregiverForm.color]);

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

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;
    await createFamily({ name: familyName.trim() });
    setFamilyName("");
  };

  const handleInvite = async () => {
    if (!familyId || !inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteSuccess("");
    try {
      await inviteCaregiver({ familyId, email: inviteEmail.trim() });
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
    } catch (err: any) {
      setInviteSuccess(err.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSaveBaby = async () => {
    if (!babyForm.name || !babyForm.dob) return;

    const measurementUnits = {
      volume: babyForm.volumeUnit,
      weight: babyForm.weightUnit,
      length: babyForm.lengthUnit,
    };

    if (babyProfile?._id) {
      await updateBabyProfile({
        id: babyProfile._id,
        name: babyForm.name,
        dob: babyForm.dob,
        gender: babyForm.gender || undefined,
        timezone: babyForm.timezone,
        measurementUnits,
      });
    } else if (familyId) {
      await createBabyProfile({
        familyId,
        name: babyForm.name,
        dob: babyForm.dob,
        gender: babyForm.gender || undefined,
        timezone: babyForm.timezone,
        measurementUnits,
      });
    }
    setIsEditing(false);
  };

  const handleAddCaregiver = async () => {
    if (!babyProfile?._id || !caregiverForm.displayName) return;

    await createCaregiver({
      babyId: babyProfile._id,
      displayName: caregiverForm.displayName,
      color: caregiverForm.color,
    });

    setCaregiverForm({
      displayName: "",
      color: CAREGIVER_COLORS[0],
    });
  };

  const handleExport = async () => {
    if (!exportDataQuery) return;

    const data = exportDataQuery;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zen-nurture-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    if (!babyProfile?._id) return;
    const name = (babyProfile.name || "").trim();

    // Typed confirmation (not a single OK) + an export-first nudge, since this
    // hard-deletes all events/reminders/caregivers with no recovery.
    const typed = prompt(
      `This permanently deletes ALL events, reminders, and caregivers for ${name || "this baby"}. It cannot be undone — export your data first if you want a backup.\n\nType the baby's name (${name || "—"}) to confirm:`
    );
    if (typed === null) return; // cancelled
    if (!name || typed.trim() !== name) return; // mismatch → safe no-op

    await clearData({ babyId: babyProfile._id });
    window.location.reload();
  };

  const patchMoraSetting = async (field: "enabled", value: boolean) => {
    setMoraSaving(field);
    try {
      await updateMoraSettings({ [field]: value });
    } finally {
      setMoraSaving(null);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-espresso mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Pending Invitations */}
        {myInvitations && myInvitations.length > 0 && (
          <section className="bg-sage/5 rounded-[20px] p-6 shadow-sm border border-sage/20">
            <h2 className="text-lg font-bold text-espresso mb-4">
              <span className="material-symbols-outlined text-sage align-middle mr-2">mail</span>
              Pending Invitations
            </h2>
            <div className="space-y-3">
              {myInvitations.map((inv: any) => (
                <div key={inv._id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-muted/10">
                  <div>
                    <p className="font-medium text-espresso">{inv.familyName}</p>
                    <p className="text-xs text-muted">Role: {inv.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => acceptInvitation({ invitationId: inv._id })}
                      className="px-4 py-2 bg-sage text-white rounded-xl text-sm font-bold hover:bg-sage/90"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => declineInvitation({ invitationId: inv._id })}
                      className="px-4 py-2 border border-muted/20 text-muted rounded-xl text-sm font-bold hover:bg-muted/5"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Family Section */}
        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
          <h2 className="text-lg font-bold text-espresso mb-4">Family</h2>

          {!currentFamily ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-5xl text-sage mb-4">family_restroom</span>
              <h3 className="text-lg font-bold text-espresso mb-2">Create Your Family</h3>
              <p className="text-muted mb-4 text-sm">
                Create a family to start adding babies and inviting caregivers
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Family name (e.g. The Sharmas)"
                  className="flex-1 p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso"
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
                <button
                  type="button"
                  onClick={handleCreateFamily}
                  disabled={!familyName.trim()}
                  className="px-6 py-3 bg-sage text-white rounded-xl font-bold disabled:opacity-50 hover:bg-sage/90"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-espresso">{currentFamily.name}</p>
                  <p className="text-xs text-muted">Your role: {currentFamily.role}</p>
                </div>
              </div>

              {/* Family Members */}
              <div className="pt-3 border-t border-muted/10">
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Members</h3>
                <div className="space-y-2">
                  {familyMembers?.map((member: any) => (
                    <div key={member._id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-espresso text-sm">{member.userName}</p>
                        <p className="text-xs text-muted">{member.userEmail} · {member.role}</p>
                      </div>
                      {currentFamily.role === "owner" && member.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => removeMember({ familyId: currentFamily._id, memberId: member._id })}
                          className="text-muted hover:text-alert-red"
                        >
                          <span className="material-symbols-outlined text-sm">person_remove</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Caregiver */}
              {["owner", "admin"].includes(currentFamily.role) && (
                <div className="pt-3 border-t border-muted/10">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Invite Caregiver</h3>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="caregiver@email.com"
                      className="flex-1 p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso"
                    />
                    <button
                      type="button"
                      onClick={handleInvite}
                      disabled={inviteLoading || !inviteEmail.trim()}
                      className="px-4 py-2 bg-sage text-white rounded-xl font-bold disabled:opacity-50"
                    >
                      {inviteLoading ? "..." : "Invite"}
                    </button>
                  </div>
                  {inviteSuccess && (
                    <p className="text-sm text-sage mt-2">{inviteSuccess}</p>
                  )}
                  {pendingInvitations && pendingInvitations.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-muted font-bold">Pending:</p>
                      {pendingInvitations.map((inv: any) => (
                        <p key={inv._id} className="text-xs text-muted">
                          {inv.email} ({inv.role})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Baby Profile */}
        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-espresso">Baby Profile</h2>
            {!isEditing && babyProfile && (
              <div className="flex items-center gap-3">
                <Link href="/add-baby" className="text-sage font-medium hover:underline">
                  Add another baby
                </Link>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sage font-medium hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {babyProfile || isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="baby-name" className="text-xs font-bold text-muted uppercase tracking-wider">Name</label>
                  <input
                    id="baby-name"
                    type="text"
                    value={babyForm.name}
                    onChange={(e) => setBabyForm({ ...babyForm, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="baby-dob" className="text-xs font-bold text-muted uppercase tracking-wider">Date of Birth</label>
                  <input
                    id="baby-dob"
                    type="date"
                    value={babyForm.dob}
                    onChange={(e) => setBabyForm({ ...babyForm, dob: e.target.value })}
                    disabled={!isEditing}
                    className="w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="baby-gender" className="text-xs font-bold text-muted uppercase tracking-wider">Gender</label>
                  <Select
                    value={babyForm.gender || "unspecified"}
                    onValueChange={(v) =>
                      setBabyForm({ ...babyForm, gender: v === "unspecified" ? "" : v })
                    }
                    disabled={!isEditing}
                  >
                    <AppSelectTrigger id="baby-gender">
                      <SelectValue placeholder="Not specified" />
                    </AppSelectTrigger>
                    <SelectContent>
                      {/* Radix forbids an empty-string value; use a sentinel and map to "". */}
                      <SelectItem value="unspecified">Not specified</SelectItem>
                      <SelectItem value="baby-boy">Baby Boy</SelectItem>
                      <SelectItem value="baby-girl">Baby Girl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="baby-timezone" className="text-xs font-bold text-muted uppercase tracking-wider">Timezone</label>
                  <Select
                    value={babyForm.timezone}
                    onValueChange={(v) => setBabyForm({ ...babyForm, timezone: v })}
                    disabled={!isEditing}
                  >
                    <AppSelectTrigger id="baby-timezone">
                      <SelectValue />
                    </AppSelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="Asia/Mumbai">Asia/Mumbai</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-muted/10">
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Measurement Units</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="baby-volume-unit" className="text-xs text-muted">Volume</label>
                    <Select
                      value={babyForm.volumeUnit}
                      onValueChange={(v) => setBabyForm({ ...babyForm, volumeUnit: v })}
                      disabled={!isEditing}
                    >
                      <AppSelectTrigger id="baby-volume-unit">
                        <SelectValue />
                      </AppSelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="baby-weight-unit" className="text-xs text-muted">Weight</label>
                    <Select
                      value={babyForm.weightUnit}
                      onValueChange={(v) => setBabyForm({ ...babyForm, weightUnit: v })}
                      disabled={!isEditing}
                    >
                      <AppSelectTrigger id="baby-weight-unit">
                        <SelectValue />
                      </AppSelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="baby-length-unit" className="text-xs text-muted">Length</label>
                    <Select
                      value={babyForm.lengthUnit}
                      onValueChange={(v) => setBabyForm({ ...babyForm, lengthUnit: v })}
                      disabled={!isEditing}
                    >
                      <AppSelectTrigger id="baby-length-unit">
                        <SelectValue />
                      </AppSelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 rounded-xl border border-muted/20 text-muted font-bold hover:bg-muted/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBaby}
                    disabled={!familyId}
                    className="flex-1 py-3 rounded-xl bg-sage text-white font-bold hover:bg-sage/90 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-sage mb-4">child_friendly</span>
              <h3 className="text-lg font-bold text-espresso mb-2">Add your baby</h3>
              <p className="text-muted mb-4">
                {familyId ? "Create a profile to start tracking" : "Create a family first, then add a baby"}
              </p>
              {familyId && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 bg-sage text-white px-6 py-3 rounded-full font-bold hover:bg-sage/90"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Baby
                </button>
              )}
            </div>
          )}
        </section>

        {babyProfile && (
          <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
            <h2 className="text-lg font-bold text-espresso mb-4">Caregivers</h2>

            <div className="space-y-3 mb-4">
              {caregivers?.map((caregiver: any) => (
                <div key={caregiver._id} className="flex items-center justify-between py-3 border-b border-muted/10 last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: caregiver.color }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-espresso">{caregiver.displayName}</span>
                      {caregiver.userId === currentFamily?.ownerId && (
                        <span className="rounded-full bg-sage/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sage">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                  {(!caregiver.userId ||
                    (currentFamily?.ownerId && caregiver.userId !== currentFamily.ownerId)) && (
                    <button
                      type="button"
                      onClick={() => deleteCaregiver({ id: caregiver._id })}
                      className="text-muted hover:text-alert-red"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={caregiverForm.displayName}
                onChange={(e) => setCaregiverForm({ ...caregiverForm, displayName: e.target.value })}
                placeholder="Caregiver name"
                className="flex-1 p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso"
              />
              <Select
                value={caregiverForm.color}
                onValueChange={(v) => setCaregiverForm({ ...caregiverForm, color: v })}
              >
                <AppSelectTrigger className="w-auto min-w-[4rem] shrink-0">
                  <SelectValue />
                </AppSelectTrigger>
                <SelectContent>
                  {CAREGIVER_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      <span
                        className="inline-block h-4 w-4 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={handleAddCaregiver}
                disabled={!caregiverForm.displayName}
                className="px-4 py-2 bg-sage text-white rounded-xl font-bold disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </section>
        )}

        {babyProfile && (
          <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
            <h2 className="text-lg font-bold text-espresso mb-4">Data</h2>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-muted/10 hover:border-sage/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sage">download</span>
                  <span className="font-medium text-espresso">Export Data</span>
                </div>
                <span className="material-symbols-outlined text-muted">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={handleClearData}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-alert-red/20 hover:border-alert-red/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-alert-red">delete_forever</span>
                  <span className="font-medium text-alert-red">Clear All Data</span>
                </div>
                <span className="material-symbols-outlined text-alert-red">chevron_right</span>
              </button>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-espresso">Appearance</h2>
              <p className="text-sm text-muted mt-1">Dark mode for 3 AM feeds.</p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-full bg-night/10 text-night flex items-center justify-center">
              <span className="material-symbols-outlined">palette</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: "light", icon: "light_mode", label: "Light" },
              { key: "dark", icon: "dark_mode", label: "Dark" },
              { key: "system", icon: "contrast", label: "System" },
            ] as const).map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={`py-4 rounded-2xl flex flex-col items-center gap-1.5 text-sm font-bold transition-all border ${
                  theme === key
                    ? "bg-espresso text-oat border-espresso"
                    : "bg-oat/30 text-muted border-muted/10 hover:border-muted/30"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </section>

        {push.state !== "unsupported" && (
          <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-espresso">Notifications</h2>
                <p className="text-sm text-muted mt-1">
                  Get push alerts for feeding reminders, medicine schedules, and more.
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-full bg-sage/10 text-sage flex items-center justify-center">
                <span className="material-symbols-outlined">notifications</span>
              </div>
            </div>

            <div className="rounded-2xl border border-muted/10 bg-oat/30 px-4 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-muted/60 text-[20px] mt-0.5">
                  {push.state === "granted" ? "notifications_active" : push.state === "denied" ? "notifications_off" : "notifications"}
                </span>
                <div>
                  <div className="font-semibold text-espresso text-[15px] leading-snug">
                    Push Notifications
                  </div>
                  <div className="text-xs text-muted mt-0.5 leading-relaxed">
                    {push.state === "granted"
                      ? "Enabled — you'll receive alerts on this device."
                      : push.state === "denied"
                      ? "Blocked by browser. Enable in browser settings."
                      : "Enable to get reminder alerts on this device."}
                  </div>
                </div>
              </div>
              <Switch
                checked={push.state === "granted"}
                disabled={push.state === "denied" || push.state === "loading"}
                onCheckedChange={(checked) => {
                  if (checked) push.subscribe();
                  else push.unsubscribe();
                }}
              />
            </div>
          </section>
        )}

        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-espresso">Mora Settings</h2>
              <p className="text-sm text-muted mt-1">
                Turn the Mora AI assistant on or off.
              </p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-full bg-sage/10 text-sage flex items-center justify-center">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              {
                key: "enabled",
                icon: "toggle_on",
                label: "Enable Mora",
                help: "Shows the Mora sidebar and lets Mora read your data and log or update entries for you.",
                value: moraSettings?.enabled ?? true,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-muted/10 bg-oat/30 px-4 py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-muted/60 text-[20px] mt-0.5">{item.icon}</span>
                  <div>
                    <div className="font-semibold text-espresso text-[15px] leading-snug">{item.label}</div>
                    <div className="text-xs text-muted mt-0.5 leading-relaxed">{item.help}</div>
                  </div>
                </div>
                <Switch
                  checked={item.value}
                  disabled={moraSaving !== null}
                  onCheckedChange={(v) => patchMoraSetting(item.key as any, v)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
          <h2 className="text-lg font-bold text-espresso mb-4">About</h2>
          <div className="text-muted text-sm">
            <p className="mb-2">Zen Nurture v0.1.0</p>
            <p>A calm, fast baby care tracker for India-first parents.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
