import { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../convex/_generated/api";

const replace = vi.fn();
let pathname = "/";
let sessionState = { data: null, isPending: false };
let convexAuthState = { isLoading: false, isAuthenticated: false };
let familiesValue: unknown[] | undefined;
let babiesValue: unknown[] | undefined;

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => convexAuthState,
  useQuery: (reference: unknown) => {
    if (reference === api.families.listMyFamilies) return familiesValue;
    return babiesValue;
  },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => sessionState,
  },
}));

import { AuthGuard } from "@/components/AuthGuard";

function renderGuard(children: ReactNode = <div>Protected</div>) {
  return render(<AuthGuard>{children}</AuthGuard>);
}

describe("AuthGuard", () => {
  beforeEach(() => {
    replace.mockReset();
    pathname = "/";
    sessionState = { data: null, isPending: false };
    convexAuthState = { isLoading: false, isAuthenticated: false };
    familiesValue = undefined;
    babiesValue = undefined;
  });

  it("renders public routes without redirecting", () => {
    pathname = "/sign-in";

    renderGuard(<div>Public page</div>);

    expect(screen.getByText("Public page")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects signed-out users to sign-in", async () => {
    renderGuard();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/sign-in");
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects incomplete setups into onboarding", async () => {
    convexAuthState = { isLoading: false, isAuthenticated: true };
    familiesValue = [{ _id: "family-1" }];
    babiesValue = [];

    renderGuard();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("redirects completed setups away from onboarding", async () => {
    pathname = "/onboarding";
    convexAuthState = { isLoading: false, isAuthenticated: true };
    familiesValue = [{ _id: "family-1" }];
    babiesValue = [{ _id: "baby-1" }];

    renderGuard();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
  });

  it("renders private content once auth and setup are ready", () => {
    convexAuthState = { isLoading: false, isAuthenticated: true };
    familiesValue = [{ _id: "family-1" }];
    babiesValue = [{ _id: "baby-1" }];

    renderGuard();

    expect(screen.getByText("Protected")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
