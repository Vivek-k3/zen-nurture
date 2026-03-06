import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

let babiesValue:
  | Array<{ _id: string; name: string; dob: string; timezone: string; familyId: string }>
  | undefined;

vi.mock("convex/react", () => ({
  useQuery: () => babiesValue,
}));

import { BabyProvider, useBaby } from "@/components/BabyContext";

function Consumer() {
  const { activeBaby, babies, switchBaby, isLoading } = useBaby();

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="active">{activeBaby?.name ?? "none"}</div>
      <div data-testid="count">{babies.length}</div>
      <button type="button" onClick={() => switchBaby("baby-2")}>
        switch
      </button>
    </div>
  );
}

describe("BabyProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    babiesValue = [
      { _id: "baby-1", name: "Aarav", dob: "2025-10-01", timezone: "Asia/Kolkata", familyId: "family-1" },
      { _id: "baby-2", name: "Mia", dob: "2025-11-01", timezone: "Asia/Kolkata", familyId: "family-1" },
    ];
  });

  it("restores a valid stored baby selection", async () => {
    localStorage.setItem("zen-nurture-active-baby", "baby-2");

    render(
      <BabyProvider>
        <Consumer />
      </BabyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("Mia");
    });
  });

  it("falls back to the first baby when stored selection is invalid", async () => {
    localStorage.setItem("zen-nurture-active-baby", "missing");

    render(
      <BabyProvider>
        <Consumer />
      </BabyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("Aarav");
    });
    expect(localStorage.getItem("zen-nurture-active-baby")).toBe("baby-1");
  });

  it("persists baby switches", async () => {
    const user = userEvent.setup();

    render(
      <BabyProvider>
        <Consumer />
      </BabyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("Aarav");
    });

    await user.click(screen.getByRole("button", { name: "switch" }));

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("Mia");
    });
    expect(localStorage.getItem("zen-nurture-active-baby")).toBe("baby-2");
  });

  it("clears stale storage when no babies exist", async () => {
    localStorage.setItem("zen-nurture-active-baby", "baby-1");
    babiesValue = [];

    render(
      <BabyProvider>
        <Consumer />
      </BabyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("none");
    });
    expect(localStorage.getItem("zen-nurture-active-baby")).toBeNull();
  });
});

