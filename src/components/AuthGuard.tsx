"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();

  const families = useQuery(
    api.families.listMyFamilies,
    session ? {} : "skip"
  );

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oat">
        <div className="text-center">
          <div className="animate-pulse">
            <span className="material-symbols-outlined text-5xl text-sage">child_friendly</span>
          </div>
          <p className="text-muted mt-4 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/sign-in");
    return null;
  }

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  if (families !== undefined && families.length === 0) {
    router.push("/onboarding");
    return null;
  }

  return <>{children}</>;
}
