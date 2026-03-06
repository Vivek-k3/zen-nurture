const PUBLIC_PATHS = ["/sign-in", "/sign-up"] as const;

export type AuthGuardDecisionInput = {
  pathname: string;
  isSessionPending: boolean;
  isConvexAuthLoading: boolean;
  isConvexAuthenticated: boolean;
  families: unknown[] | undefined;
  babies: unknown[] | undefined;
};

export type AuthGuardDecision = {
  isPublic: boolean;
  isOnboarding: boolean;
  isSetupLoading: boolean;
  hasCompletedSetup: boolean;
  needsLogin: boolean;
  needsOnboarding: boolean;
  shouldExitOnboarding: boolean;
  shouldShowLoading: boolean;
  redirectTo: "/sign-in" | "/onboarding" | "/" | null;
};

export function getAuthGuardDecision({
  pathname,
  isSessionPending,
  isConvexAuthLoading,
  isConvexAuthenticated,
  families,
  babies,
}: AuthGuardDecisionInput): AuthGuardDecision {
  const isPublic = PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number]);
  const isOnboarding = pathname === "/onboarding";
  const familyCount = families?.length ?? 0;
  const babyCount = babies?.length ?? 0;
  const isSetupLoading =
    isConvexAuthenticated && !isPublic && (families === undefined || babies === undefined);
  const hasCompletedSetup = familyCount > 0 && babyCount > 0;
  const needsLogin =
    !isSessionPending &&
    !isConvexAuthLoading &&
    !isConvexAuthenticated &&
    !isPublic;
  const needsOnboarding =
    !isSessionPending &&
    !isConvexAuthLoading &&
    isConvexAuthenticated &&
    !isOnboarding &&
    !isPublic &&
    !isSetupLoading &&
    !hasCompletedSetup;
  const shouldExitOnboarding =
    !isSessionPending &&
    !isConvexAuthLoading &&
    isConvexAuthenticated &&
    isOnboarding &&
    !isSetupLoading &&
    hasCompletedSetup;

  let redirectTo: AuthGuardDecision["redirectTo"] = null;
  if (!isPublic && !isSessionPending && !isConvexAuthLoading && !isSetupLoading) {
    if (needsLogin) {
      redirectTo = "/sign-in";
    } else if (shouldExitOnboarding) {
      redirectTo = "/";
    } else if (needsOnboarding) {
      redirectTo = "/onboarding";
    }
  }

  return {
    isPublic,
    isOnboarding,
    isSetupLoading,
    hasCompletedSetup,
    needsLogin,
    needsOnboarding,
    shouldExitOnboarding,
    shouldShowLoading:
      !isPublic &&
      (
        isSessionPending ||
        isConvexAuthLoading ||
        isSetupLoading ||
        needsLogin ||
        needsOnboarding ||
        shouldExitOnboarding
      ),
    redirectTo,
  };
}

