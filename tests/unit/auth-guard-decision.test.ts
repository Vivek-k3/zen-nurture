import { describe, expect, it } from "vitest";
import { getAuthGuardDecision } from "@/components/auth/authGuardDecision";

describe("getAuthGuardDecision", () => {
  it("allows public routes immediately", () => {
    const decision = getAuthGuardDecision({
      pathname: "/sign-in",
      isSessionPending: false,
      isConvexAuthLoading: false,
      isConvexAuthenticated: false,
      families: undefined,
      babies: undefined,
    });

    expect(decision.isPublic).toBe(true);
    expect(decision.redirectTo).toBeNull();
    expect(decision.shouldShowLoading).toBe(false);
  });

  it("redirects signed out users on private routes", () => {
    const decision = getAuthGuardDecision({
      pathname: "/",
      isSessionPending: false,
      isConvexAuthLoading: false,
      isConvexAuthenticated: false,
      families: undefined,
      babies: undefined,
    });

    expect(decision.needsLogin).toBe(true);
    expect(decision.redirectTo).toBe("/sign-in");
    expect(decision.shouldShowLoading).toBe(true);
  });

  it("waits for setup data before deciding onboarding", () => {
    const decision = getAuthGuardDecision({
      pathname: "/",
      isSessionPending: false,
      isConvexAuthLoading: false,
      isConvexAuthenticated: true,
      families: undefined,
      babies: undefined,
    });

    expect(decision.isSetupLoading).toBe(true);
    expect(decision.redirectTo).toBeNull();
    expect(decision.shouldShowLoading).toBe(true);
  });

  it("redirects incomplete setups into onboarding", () => {
    const decision = getAuthGuardDecision({
      pathname: "/",
      isSessionPending: false,
      isConvexAuthLoading: false,
      isConvexAuthenticated: true,
      families: [{}],
      babies: [],
    });

    expect(decision.needsOnboarding).toBe(true);
    expect(decision.redirectTo).toBe("/onboarding");
  });

  it("redirects completed setups away from onboarding", () => {
    const decision = getAuthGuardDecision({
      pathname: "/onboarding",
      isSessionPending: false,
      isConvexAuthLoading: false,
      isConvexAuthenticated: true,
      families: [{}],
      babies: [{}],
    });

    expect(decision.hasCompletedSetup).toBe(true);
    expect(decision.shouldExitOnboarding).toBe(true);
    expect(decision.redirectTo).toBe("/");
  });
});

