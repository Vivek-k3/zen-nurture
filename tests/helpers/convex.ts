/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { vi } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

type MockUser = {
  _id: string;
  email: string;
  name?: string;
};

const authState: {
  currentUser: MockUser | null;
  users: Map<string, MockUser>;
} = {
  currentUser: null,
  users: new Map(),
};

export const mockAuthComponent = {
  safeGetAuthUser: vi.fn(async () => authState.currentUser),
  getAnyUserById: vi.fn(async (_ctx: unknown, userId: string) => authState.users.get(userId) ?? null),
};

vi.mock("../../convex/auth", () => ({
  authComponent: mockAuthComponent,
  getAuthUser: vi.fn(async () => authState.currentUser),
}));

const allModules = import.meta.glob("../../convex/**/*.{ts,js}");
const convexModules = Object.fromEntries(
  Object.entries(allModules).filter(([modulePath]) => {
    return !modulePath.endsWith(".test.ts");
  })
);

export function setConvexUser(user: MockUser | null) {
  authState.currentUser = user;
  if (user) {
    authState.users.set(user._id, user);
  }
}

export function makeConvexTest() {
  return convexTest(schema, convexModules);
}

export async function createFamilyAndBaby(
  t: ReturnType<typeof makeConvexTest>,
  options?: {
    familyName?: string;
    babyName?: string;
    dob?: string;
    timezone?: string;
  }
) {
  const familyId = await t.mutation(api.families.createFamily, {
    name: options?.familyName ?? "Test Family",
  });

  const babyId = await t.mutation(api.events.createBabyProfile, {
    familyId,
    name: options?.babyName ?? "Aarav",
    dob: options?.dob ?? "2025-10-01",
    timezone: options?.timezone ?? "Asia/Kolkata",
  });

  return { familyId, babyId };
}

export async function createEventForBaby(
  t: ReturnType<typeof makeConvexTest>,
  args: {
    babyId: string;
    type: string;
    timestamp: string;
    payload?: Record<string, unknown>;
    source?: string;
  }
) {
  return await t.mutation(api.events.createEvent, {
    babyId: args.babyId as any,
    type: args.type,
    timestamp: args.timestamp,
    payload: args.payload,
    source: args.source,
  });
}
