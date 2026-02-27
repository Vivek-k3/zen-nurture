"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const redirecting = useRef(false);

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
    if (redirecting.current) return;
    if (needsLogin) {
      redirecting.current = true;
      router.push("/sign-in");
    } else if (needsOnboarding) {
      redirecting.current = true;
      router.push("/onboarding");
    }
  }, [needsLogin, needsOnboarding, router]);

  useEffect(() => {
    redirecting.current = false;
  }, [pathname]);

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
