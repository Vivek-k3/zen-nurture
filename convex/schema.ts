import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  families: defineTable({
    name: v.string(),
    ownerId: v.string(),
    createdAt: v.string(),
  }).index("by_ownerId", ["ownerId"]),

  familyMembers: defineTable({
    familyId: v.id("families"),
    userId: v.string(),
    role: v.string(),
    joinedAt: v.string(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_userId", ["userId"])
    .index("by_familyId_userId", ["familyId", "userId"]),

  familyInvitations: defineTable({
    familyId: v.id("families"),
    email: v.string(),
    role: v.string(),
    invitedBy: v.string(),
    status: v.string(),
    createdAt: v.string(),
    expiresAt: v.string(),
  })
    .index("by_familyId", ["familyId"])
    .index("by_email", ["email"])
    .index("by_email_status", ["email", "status"]),

  babyProfiles: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    dob: v.string(),
    gender: v.optional(v.string()),
    timezone: v.string(),
    measurementUnits: v.optional(v.object({
      volume: v.optional(v.string()),
      weight: v.optional(v.string()),
      length: v.optional(v.string()),
    })),
    createdAt: v.string(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_familyId", ["familyId"]),

  caregivers: defineTable({
    babyId: v.id("babyProfiles"),
    displayName: v.string(),
    color: v.string(),
    userId: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_babyId", ["babyId"])
    .index("by_userId", ["userId"]),

  events: defineTable({
    babyId: v.id("babyProfiles"),
    type: v.string(),
    timestamp: v.string(),
    caregiverId: v.optional(v.id("caregivers")),
    payload: v.optional(v.any()),
    source: v.optional(v.string()),
    loggedBy: v.optional(v.string()),
    loggedByName: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_babyId_timestamp", ["babyId", "timestamp"])
    .index("by_type_timestamp", ["type", "timestamp"])
    .index("by_babyId_type", ["babyId", "type"]),

  formulas: defineTable({
    name: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }),

  medicines: defineTable({
    name: v.string(),
    defaultDoseUnit: v.optional(v.string()),
    concentrationText: v.optional(v.string()),
    instructions: v.optional(v.string()),
    createdAt: v.string(),
  }),

  reminderRules: defineTable({
    babyId: v.id("babyProfiles"),
    category: v.string(),
    title: v.string(),
    triggerType: v.string(),
    triggerConfig: v.optional(v.any()),
    enabled: v.boolean(),
    quietHoursStart: v.optional(v.number()),
    quietHoursEnd: v.optional(v.number()),
    snoozeOptions: v.optional(v.any()),
    createdAt: v.string(),
  })
    .index("by_babyId", ["babyId"])
    .index("by_babyId_category", ["babyId", "category"]),

  files: defineTable({
    babyId: v.id("babyProfiles"),
    filename: v.string(),
    mimeType: v.string(),
    storageId: v.string(),
    tags: v.optional(v.array(v.string())),
    capturedAt: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_babyId", ["babyId"])
    .index("by_tags", ["tags"]),

  milestones: defineTable({
    babyId: v.id("babyProfiles"),
    key: v.string(),
    title: v.string(),
    category: v.string(),
    achievedAt: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_babyId", ["babyId"])
    .index("by_babyId_key", ["babyId", "key"]),

  weeklyDigests: defineTable({
    babyId: v.id("babyProfiles"),
    weekStart: v.string(),
    weekEnd: v.string(),
    thisWeek: v.any(),
    lastWeek: v.any(),
    summary: v.string(),
    createdAt: v.string(),
  })
    .index("by_babyId", ["babyId"])
    .index("by_babyId_weekStart", ["babyId", "weekStart"]),

  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  moraThreads: defineTable({
    babyId: v.optional(v.id("babyProfiles")),
    title: v.string(),
    status: v.string(),
    lastMessageAt: v.string(),
    createdAt: v.string(),
  }).index("by_babyId_lastMessageAt", ["babyId", "lastMessageAt"]),

  moraMessages: defineTable({
    threadId: v.id("moraThreads"),
    role: v.string(),
    parts: v.any(),
    text: v.optional(v.string()),
    routeContext: v.optional(v.object({
      pathname: v.string(),
      pageLabel: v.string(),
    })),
    createdAt: v.string(),
  }).index("by_threadId_createdAt", ["threadId", "createdAt"]),

  moraActions: defineTable({
    threadId: v.id("moraThreads"),
    status: v.string(),
    actionType: v.string(),
    payload: v.any(),
    preview: v.string(),
    requiresApproval: v.boolean(),
    approvedAt: v.optional(v.string()),
    executedAt: v.optional(v.string()),
    error: v.optional(v.string()),
    result: v.optional(v.any()),
    createdAt: v.string(),
  })
    .index("by_threadId_createdAt", ["threadId", "createdAt"])
    .index("by_status", ["status"]),
});
