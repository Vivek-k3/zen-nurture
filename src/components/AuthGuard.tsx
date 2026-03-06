"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

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

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isOnboarding = pathname === "/onboarding";
  const familyCount = families?.length ?? 0;
  const babyCount = babies?.length ?? 0;
  const isSetupLoading =
    isConvexAuthenticated && !isPublic && (families === undefined || babies === undefined);
  const hasCompletedSetup = familyCount > 0 && babyCount > 0;
  const needsLogin = !isPending && !isConvexAuthLoading && !isConvexAuthenticated && !isPublic;
  const needsOnboarding =
    !isPending &&
    !isConvexAuthLoading &&
    isConvexAuthenticated &&
    !isOnboarding &&
    !isPublic &&
    !isSetupLoading &&
    !hasCompletedSetup;
  const shouldExitOnboarding =
    !isPending &&
    !isConvexAuthLoading &&
    isConvexAuthenticated &&
    isOnboarding &&
    !isSetupLoading &&
    hasCompletedSetup;

  useEffect(() => {
    if (isPending || isPublic || isConvexAuthLoading || isSetupLoading) return;

    if (needsLogin) {
      router.replace("/sign-in");
    } else if (shouldExitOnboarding) {
      router.replace("/");
    } else if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [
    isPending,
    isPublic,
    isConvexAuthLoading,
    isSetupLoading,
    needsLogin,
    shouldExitOnboarding,
    needsOnboarding,
    router,
  ]);

  if (isPublic) return <>{children}</>;

  if (
    isPending ||
    isConvexAuthLoading ||
    isSetupLoading ||
    needsLogin ||
    needsOnboarding ||
    shouldExitOnboarding
  ) {
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
