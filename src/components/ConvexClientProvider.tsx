"use client";

import { ReactNode, useCallback } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useAuthFromBetterAuth() {
  const { data: session, isPending } = authClient.useSession();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const response = await fetch("/api/auth/convex/token", {
          credentials: "include",
        });
        if (!response.ok) return null;
        const { token } = await response.json();
        return token ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  return {
    isLoading: isPending,
    isAuthenticated: !!session,
    fetchAccessToken,
  };
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromBetterAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
