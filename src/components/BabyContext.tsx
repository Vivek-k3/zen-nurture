"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useQuery } from "convex/react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSelectedId(stored);
    setHydrated(true);
  }, []);

  const babyList = useMemo(() => babies ?? [], [babies]);

  useEffect(() => {
    if (!hydrated) return;

    const hasSelectedBaby =
      selectedId !== null && babyList.some((baby) => String(baby._id) === selectedId);

    if (hasSelectedBaby) return;

    if (babyList.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    const fallbackId = String(babyList[0]._id);
    if (selectedId !== fallbackId) {
      setSelectedId(fallbackId);
      localStorage.setItem(STORAGE_KEY, fallbackId);
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

  return (
    <BabyCtx.Provider
      value={{
        babies: babyList,
        activeBaby,
        activeBabyId: activeBaby?._id ?? null,
        switchBaby,
        isLoading: !hydrated || babies === undefined,
      }}
    >
      {children}
    </BabyCtx.Provider>
  );
}
