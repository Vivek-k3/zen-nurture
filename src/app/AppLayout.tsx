"use client";

import { useState, ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import QuickLoggerDrawer from "./components/QuickLoggerDrawer";
import MoraSidebar from "./components/MoraSidebar";
import UserMenu from "./components/UserMenu";
import MoraOrb from "@/components/MoraOrb";

const CHROMELESS_PATHS = ["/sign-in", "/sign-up", "/onboarding"];

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isMoraOpen, setIsMoraOpen] = useState(false);
  const moraTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOpenQuickLogger = () => setIsQuickLogOpen(true);
    window.addEventListener('openQuickLogger', handleOpenQuickLogger);
    return () => window.removeEventListener('openQuickLogger', handleOpenQuickLogger);
  }, []);

  const openQuickLog = () => {
    setIsMoraOpen(false);
    setIsQuickLogOpen(true);
  };

  const openMora = () => {
    setIsQuickLogOpen(false);
    setIsMoraOpen(true);
  };

  const closeMora = () => {
    setIsMoraOpen(false);
    requestAnimationFrame(() => moraTriggerRef.current?.focus());
  };

  return (
    <div className="relative flex min-h-screen w-full bg-oat">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-oat relative">
        <header className="hidden lg:flex h-20 px-8 items-center justify-between shrink-0 border-b border-black/5 bg-oat/50 backdrop-blur-md z-10">
          <div>
            <h2 className="text-2xl font-bold text-espresso font-serif tracking-tight">Zen Nurture</h2>
            <p className="text-muted text-sm">Baby Care Tracker</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openQuickLog}
              className="flex items-center gap-2 bg-espresso text-oat px-5 py-2.5 rounded-full shadow-md hover:bg-espresso/90 transition-all group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="text-sm font-bold">Log Event</span>
            </button>
            <button
              ref={moraTriggerRef}
              type="button"
              onClick={openMora}
              aria-expanded={isMoraOpen}
              aria-controls="mora-sidebar"
              className="flex items-center gap-2 bg-white/90 text-espresso pl-3 pr-4 py-2 rounded-full shadow-sm border border-black/5 hover:border-sage/30 hover:bg-white transition-all"
            >
              <MoraOrb size="xs" />
              <span className="text-sm font-bold">Mora</span>
            </button>

            <UserMenu />
          </div>
        </header>

        <header className="lg:hidden h-16 px-4 flex items-center justify-between shrink-0 bg-oat z-10">
          <div className="flex items-center gap-3">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full h-8 w-8 shadow-sm"
              style={{ backgroundImage: 'url("https://picsum.photos/seed/baby/200/200")' }}
            ></div>
            <h1 className="text-lg font-bold text-espresso font-serif">Zen Nurture</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              ref={moraTriggerRef}
              type="button"
              onClick={openMora}
              aria-expanded={isMoraOpen}
              aria-controls="mora-sidebar"
              className="h-10 w-10 rounded-full flex items-center justify-center bg-white/80 border border-black/5"
              aria-label="Open Mora"
            >
              <MoraOrb size="xs" />
            </button>
            <button type="button" className="h-10 w-10 flex items-center justify-center text-espresso">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        <button
          type="button"
          onClick={openQuickLog}
          className="lg:hidden fixed bottom-6 right-6 h-14 w-14 bg-espresso text-oat rounded-full shadow-xl shadow-espresso/20 flex items-center justify-center z-30 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>

      <QuickLoggerDrawer isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} />
      <MoraSidebar isOpen={isMoraOpen} onClose={closeMora} />
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (CHROMELESS_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
