"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { getAuthGuardDecision } from "@/components/auth/authGuardDecision";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const pathname = usePathname();
  const router = useRouter();

  const families = useQuery(
    api.families.listMyFamilies,
    isConvexAuthenticated ? {} : "skip"
  );
  const babies = useQuery(
    api.events.getBabyProfiles,
    isConvexAuthenticated ? {} : "skip"
  );
  const decision = getAuthGuardDecision({
    pathname,
    isSessionPending: isPending,
    isConvexAuthLoading,
    isConvexAuthenticated,
    families,
    babies,
  });

  useEffect(() => {
    if (decision.redirectTo) {
      router.replace(decision.redirectTo);
    }
  }, [decision.redirectTo, router]);

  if (decision.isPublic) return <>{children}</>;

  if (decision.shouldShowLoading) {
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

  return <>{children}</>;
}
