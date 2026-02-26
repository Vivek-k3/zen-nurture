"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

  const switchBaby = useCallback((id: any) => {
    const idStr = String(id);
    setSelectedId(idStr);
    localStorage.setItem(STORAGE_KEY, idStr);
  }, []);

  const babyList = babies ?? [];

  let activeBaby: BabyProfile | null = null;
  if (selectedId) {
    activeBaby = babyList.find((b) => String(b._id) === selectedId) ?? null;
  }
  if (!activeBaby && babyList.length > 0) {
    activeBaby = babyList[0];
    if (hydrated && activeBaby) {
      localStorage.setItem(STORAGE_KEY, String(activeBaby._id));
    }
  }

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
