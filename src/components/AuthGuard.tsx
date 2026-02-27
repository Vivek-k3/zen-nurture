"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

/**
 * Guards routes by redirecting unauthenticated users to sign-in and users without families to onboarding, rendering `children` when access is allowed.
 *
 * While authentication or onboarding status is being determined this component renders a centered loading indicator. Public paths (e.g. `/sign-in`, `/sign-up`) bypass the guard.
 *
 * @param children - The content to render when access is permitted.
 * @returns The guarded children or a loading UI while authentication/onboarding state is resolved. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();

  const families = useQuery(
    api.families.listMyFamilies,
    session ? {} : "skip"
  );

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isOnboarding = pathname === "/onboarding";
  const needsLogin = !isPending && !session && !isPublic;
  const needsOnboarding =
    !isPending && !!session && !isOnboarding && !isPublic && families !== undefined && families.length === 0;

  useEffect(() => {
    if (isPending || isPublic) return;

    if (needsLogin) {
      router.replace("/sign-in");
    } else if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [isPending, isPublic, needsLogin, needsOnboarding, pathname, router]);

  if (isPublic) return <>{children}</>;

  if (isPending || needsLogin || needsOnboarding) {
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
