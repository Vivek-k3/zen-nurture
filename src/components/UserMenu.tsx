"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-10 w-10 bg-sage/10 rounded-full flex items-center justify-center text-sage font-bold text-sm shadow-sm border border-sage/20 cursor-pointer hover:bg-sage/20 transition-colors"
        aria-label="User menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-lg border border-muted/10 py-2 z-50">
          <div className="px-4 py-3 border-b border-muted/10">
            <p className="font-medium text-espresso text-sm">{session?.user?.name}</p>
            <p className="text-xs text-muted">{session?.user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-sm text-alert-red hover:bg-alert-red/5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
