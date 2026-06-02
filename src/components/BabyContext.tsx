"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type BabyProfile = {
  _id: any;
  name: string;
  dob: string;
  gender?: string;
  timezone: string;
  familyId: any;
  [key: string]: any;
};

interface BabyContextValue {
  babies: BabyProfile[];
  activeBaby: BabyProfile | null;
  activeBabyId: any | null;
  switchBaby: (id: any) => void;
  isLoading: boolean;
}

const BabyCtx = createContext<BabyContextValue>({
  babies: [],
  activeBaby: null,
  activeBabyId: null,
  switchBaby: () => {},
  isLoading: true,
});

export function useBaby() {
  return useContext(BabyCtx);
}

const STORAGE_KEY = "zen-nurture-active-baby";

export function BabyProvider({ children }: { children: ReactNode }) {
  const babies = useQuery(api.events.getBabyProfiles, {}) as BabyProfile[] | undefined;
  const persistActiveBaby = useMutation(api.events.setActiveBaby);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const autoSelectedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSelectedId(stored);
    setHydrated(true);
  }, []);

  const babyList = useMemo(() => babies ?? [], [babies]);

  // Auto-select first baby if none stored
  useEffect(() => {
    if (!hydrated || autoSelectedRef.current) return;
    if (selectedId && babyList.some((b) => String(b._id) === selectedId)) return;
    if (babyList.length > 0) {
      const firstId = String(babyList[0]._id);
      setSelectedId(firstId);
      localStorage.setItem(STORAGE_KEY, firstId);
      autoSelectedRef.current = true;
    }
  }, [hydrated, selectedId, babyList]);

  const switchBaby = useCallback((id: any) => {
    const idStr = String(id);
    setSelectedId(idStr);
    localStorage.setItem(STORAGE_KEY, idStr);
  }, []);

  const activeBaby = selectedId
    ? babyList.find((b) => String(b._id) === selectedId) ?? babyList[0] ?? null
    : babyList[0] ?? null;
  const activeBabyId = activeBaby?._id ?? null;

  // Persist the active baby server-side so Mora (which runs on the server) acts
  // on the same baby the UI is showing.
  useEffect(() => {
    if (activeBabyId) void persistActiveBaby({ babyId: activeBabyId }).catch(() => {});
  }, [activeBabyId, persistActiveBaby]);

  return (
    <BabyCtx.Provider
      value={{
        babies: babyList,
        activeBaby,
        activeBabyId,
        switchBaby,
        isLoading: !hydrated || babies === undefined,
      }}
    >
      {children}
    </BabyCtx.Provider>
  );
}
