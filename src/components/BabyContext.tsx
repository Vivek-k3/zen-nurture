"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from "react";
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

/**
 * Provides baby profiles and active-baby state to descendant components.
 *
 * The provider fetches baby profiles, persists and restores the selected baby id in localStorage,
 * auto-selects the first baby after hydration if no valid selection exists, and exposes
 * the list of babies, the currently active baby and its id, a function to switch the active baby,
 * and a loading flag.
 *
 * @param children - React children to render within the provider
 * @returns A context provider element supplying `babies`, `activeBaby`, `activeBabyId`, `switchBaby`, and `isLoading` to its subtree
 */
export function BabyProvider({ children }: { children: ReactNode }) {
  const babies = useQuery(api.events.getBabyProfiles, {}) as BabyProfile[] | undefined;
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
