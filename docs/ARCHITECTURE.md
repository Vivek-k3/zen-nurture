# Zen Nurture — Architecture Diagrams

This document describes the Zen Nurture architecture using code-based diagrams (Mermaid, PlantUML).

---

## 1. C4 Context Diagram

High-level system context: who uses the system and what external systems it integrates with.

```mermaid
graph TB
    subgraph "Zen Nurture System"
        System[Zen Nurture<br/>Baby care tracking app<br/>with AI assistant Mora]
    end

    Caregiver[Caregiver<br/>Logs events, views trends,<br/>manages reminders]
    Family[Family Member<br/>Shared baby access]

    OpenAI[OpenAI API<br/>GPT-4 for Mora]
    Push[Push Service<br/>Web Push API]
    Vercel[Vercel<br/>Hosting]

    Caregiver -->|Logs, Views, Chats| System
    Family -->|Shared access| System
    System -->|LLM streaming| OpenAI
    System -->|Notifications| Push
    System -->|Deployed on| Vercel

    style System fill:#1168bd
    style Caregiver fill:#08427b
    style Family fill:#08427b
    style OpenAI fill:#999
    style Push fill:#999
    style Vercel fill:#999
```

---

## 2. System Architecture Diagram

Full stack with client, API, backend, and data layers.

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Next.js App<br/>React 19, App Router]
        Tailwind[Tailwind CSS v4<br/>shadcn/ui]
    end

    subgraph "API Layer"
        AuthAPI[Better-Auth<br/>/api/auth/*]
        MoraAPI[Mora API<br/>/api/mora]
        DigestAPI[Digest API<br/>/api/digest/generate]
        PushAPI[Push API<br/>/api/push/*]
    end

    subgraph "Convex Backend"
        ConvexHTTP[Convex HTTP Router<br/>Auth, Push Cron]
        Queries[Queries<br/>events, families, mora]
        Mutations[Mutations<br/>createEvent, approveAction]
        Actions[Actions<br/>Node.js for external APIs]
    end

    subgraph "Convex Database"
        ConvexDB[(Convex DB<br/>real-time, reactive)]
    end

    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4]
    end

    Web --> AuthAPI
    Web --> MoraAPI
    Web --> DigestAPI
    Web --> PushAPI
    Web -->|useQuery / useMutation| ConvexHTTP

    AuthAPI --> ConvexHTTP
    MoraAPI --> ConvexHTTP
    MoraAPI --> OpenAI

    ConvexHTTP --> Queries
    ConvexHTTP --> Mutations
    ConvexHTTP --> Actions
    Queries --> ConvexDB
    Mutations --> ConvexDB

    style ConvexDB fill:#ff6b6b
    style MoraAPI fill:#4ecdc4
    style AuthAPI fill:#4ecdc4
```

---

## 3. Authentication Flow (Sequence Diagram)

How Better-Auth and Convex tokens are bridged.

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js App
    participant Auth as Better-Auth<br/>/api/auth/*
    participant Convex as Convex Provider
    participant Token as /api/auth/convex/token
    participant DB as Convex DB

    User->>Web: Sign in / Sign up
    Web->>Auth: POST /api/auth/sign-in
    Auth->>Auth: Validate credentials
    Auth-->>Web: Set session cookie

    Note over Web,DB: Subsequent requests

    User->>Web: Navigate page
    Web->>Convex: useQuery / useMutation
    Convex->>Convex: fetchAccessToken()
    Convex->>Token: GET /api/auth/convex/token<br/>credentials: include
    Token->>Auth: Validate session cookie
    Auth-->>Token: Session valid
    Token-->>Convex: JWT token
    Convex->>DB: Authenticated request
    DB-->>Convex: Data
    Convex-->>Web: Reactive data
```

---

## 4. Mora AI Flow (Sequence Diagram)

Mora chat with tool execution and approval flow.

```mermaid
sequenceDiagram
    actor User
    participant MoraUI as Mora UI<br/>@assistant-ui/react
    participant MoraAPI as /api/mora
    participant OpenAI as OpenAI API
    participant Convex as Convex

    User->>MoraUI: Send message
    MoraUI->>MoraAPI: POST /api/mora (stream)
    MoraAPI->>Convex: getMoraSettings, getBabyProfile
    Convex-->>MoraAPI: Context
    MoraAPI->>OpenAI: streamText (tools: createEvent, etc.)
    OpenAI-->>MoraAPI: Stream + tool calls

    alt Tool requires approval
        MoraAPI->>Convex: createPendingMoraAction
        MoraAPI-->>MoraUI: Tool result (pending)
        MoraUI->>User: Show MoraApprovalCard
        User->>MoraUI: Approve
        MoraUI->>Convex: executeApprovedMoraAction
        Convex-->>MoraUI: Result
        MoraUI->>MoraAPI: Continue stream
    else Tool auto-execute (YOLO)
        MoraAPI->>Convex: executeApprovedMoraAction
        MoraAPI-->>MoraUI: Tool result
    end

    MoraAPI-->>MoraUI: Stream complete
    MoraUI-->>User: Assistant response
```

---

## 5. Data Entity Relationship Diagram

Convex tables and their relationships.

```mermaid
erDiagram
    families ||--o{ familyMembers : has
    families ||--o{ familyInvitations : has
    families ||--o{ babyProfiles : contains

    babyProfiles ||--o{ caregivers : has
    babyProfiles ||--o{ events : "logs"
    babyProfiles ||--o{ reminderRules : has
    babyProfiles ||--o{ events : "logs"
    babyProfiles ||--o{ milestones : has
    babyProfiles ||--o{ weeklyDigests : has
    babyProfiles ||--o{ files : has
    babyProfiles ||--o{ moraThreads : "optional"
    babyProfiles ||--o{ moraMetrics : "optional"

    moraThreads ||--o{ moraMessages : contains
    moraThreads ||--o{ moraActions : contains

    caregivers ||--o{ events : "logged by"
    formulas ||--o{ events : "reference"
    medicines ||--o{ events : "reference"

    families {
        string name
        string ownerId
        string createdAt
    }

    babyProfiles {
        string name
        string dob
        string timezone
        string createdAt
    }

    events {
        string type
        string timestamp
        object payload
        string source
    }

    moraThreads {
        string title
        string status
        string lastMessageAt
    }

    moraActions {
        string status
        string actionType
        object payload
        boolean requiresApproval
    }
```

---

## 6. Component Diagram (Frontend)

React app structure and key components.

```mermaid
graph TB
    subgraph "Layout"
        AppLayout[AppLayout]
        Sidebar[Sidebar]
        BabySwitcher[BabySwitcher]
        MoraSidebar[MoraSidebar]
    end

    subgraph "Pages"
        Today[Today / page.tsx]
        Trends[Trends]
        Records[Records]
        Reminders[Reminders]
        Milestones[Milestones]
        Settings[Settings]
    end

    subgraph "Shared Components"
        ActivityFeed[ActivityFeed]
        QuickLoggerDrawer[QuickLoggerDrawer]
        QuickSuggestionsPills[QuickSuggestionsPills]
    end

    subgraph "Mora AI"
        MoraThread[MoraThread]
        MoraMessageList[MoraMessageList]
        MoraComposer[MoraComposer]
        MoraApprovalCard[MoraApprovalCard]
        MoraToolUIs[MoraToolUIs]
    end

    subgraph "Context"
        BabyProvider[BabyProvider]
        ThemeContext[ThemeContext]
        TourContext[TourContext]
    end

    subgraph "Data Layer"
        useQuery[useQuery]
        useMutation[useMutation]
    end

    AppLayout --> Sidebar
    AppLayout --> BabySwitcher
    AppLayout --> MoraSidebar

    Today --> ActivityFeed
    Today --> QuickLoggerDrawer
    Today --> QuickSuggestionsPills

    MoraSidebar --> MoraThread
    MoraThread --> MoraMessageList
    MoraThread --> MoraComposer
    MoraThread --> MoraApprovalCard
    MoraApprovalCard --> MoraToolUIs

    BabyProvider --> Today
    BabyProvider --> Trends
    BabyProvider --> Records

    ActivityFeed --> useQuery
    QuickLoggerDrawer --> useMutation
    MoraApprovalCard --> useMutation
```

---

## 7. Event Flow (Data Flow Diagram)

How events flow from user action to storage and display.

```mermaid
graph LR
    User[User Action] --> Frontend[Frontend]
    Frontend --> Validation{Validation}
    Validation -->|Invalid| Error[Show Error]
    Validation -->|Valid| Mutation[useMutation]
    Mutation --> Convex[Convex Mutation]
    Convex --> Auth{Authenticated?}
    Auth -->|No| Unauthorized[401]
    Auth -->|Yes| DB[(events table)]
    DB --> Reactive[Reactive Update]
    Reactive --> useQuery[useQuery]
    useQuery --> Frontend
    Frontend --> Render[Render UI]
```

---

## 8. Convex Module Map

Backend modules and their responsibilities.

```mermaid
graph TB
    subgraph "convex/"
        auth[auth.ts<br/>Convex identity]
        authHttp[authHttp.ts<br/>Better-Auth HTTP handler]
        authNode[authNode.ts<br/>Node auth]
        events[events.ts<br/>CRUD, aggregates, reminders]
        families[families.ts<br/>Families, members, invites]
        mora[mora.ts<br/>Threads, messages, actions]
        digest[digest.ts<br/>Weekly digests]
        milestones[milestones.ts]
        push[push.ts<br/>Push subscriptions]
        pushCron[pushCron.ts<br/>Cron reminders]
        photos[photos.ts]
        nudges[nudges.ts]
    end

    schema[(schema.ts)]
    http[http.ts<br/>HTTP router]

    events --> schema
    families --> schema
    mora --> schema
    events --> auth
    families --> auth
    mora --> auth

    http --> authHttp
    http --> pushCron
```

---

## 9. Mora Tool Execution Flow

Tools available to Mora and how they execute.

```mermaid
flowchart TD
    subgraph "Mora Tools"
        T1[create_event]
        T2[create_reminder]
        T3[update_reminder]
        T4[delete_reminder]
        T5[get_brief]
        T6[get_events]
        T7[get_aggregates]
        T8[get_reminders]
        T9[get_reminder_rules]
    end

    subgraph "Execution Path"
        Tool[Tool Called] --> Check{requiresApproval?}
        Check -->|Yes| Pending[createPendingMoraAction]
        Check -->|No| Direct[executeApprovedMoraAction]
        Pending --> Card[MoraApprovalCard]
        Card --> User[User Approves/Rejects]
        User -->|Approve| Execute[executeApprovedMoraAction]
        User -->|Reject| Reject[rejectMoraAction]
        Execute --> Convex[(Convex)]
        Direct --> Convex
    end

    T1 --> Tool
    T2 --> Tool
    T3 --> Tool
    T4 --> Tool
```

---

## References

- [Mermaid Documentation](https://mermaid.js.org/)
- [C4 Model](https://c4model.com/)
- [Convex Documentation](https://docs.convex.dev/)
- [Better-Auth](https://www.better-auth.com/)
