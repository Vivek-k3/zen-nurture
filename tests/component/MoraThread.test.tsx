import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setText = vi.fn();
const send = vi.fn();
let currentText = "";

vi.mock("@assistant-ui/react", () => ({
  ThreadPrimitive: {
    Viewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Messages: () => null,
    Empty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Suggestion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  ComposerPrimitive: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Input: (props: React.ComponentProps<"textarea">) => <textarea aria-label="Composer input" {...props} />,
    Send: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  MessagePrimitive: {
    Content: () => null,
    If: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  useMessage: () => ({ status: { type: "done" } }),
  useComposerRuntime: () => ({
    getState: () => ({ text: currentText }),
    setText,
    send,
  }),
}));

vi.mock("@/components/mora/VoiceButton", () => ({
  default: ({ onTranscript }: { onTranscript: (text: string) => void }) => (
    <button type="button" onClick={() => onTranscript("voice note")}>
      voice
    </button>
  ),
}));

vi.mock("@/components/MoraOrb", () => ({
  default: () => <div />,
}));

vi.mock("@/components/mora/MoraFirstLook", () => ({
  default: () => <div>first look</div>,
}));

vi.mock("@/components/shimmering-text/shimmering-text", () => ({
  ShimmeringText: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
}));

import { MoraComposer, mergeComposerTranscript } from "@/components/mora/MoraThread";

describe("MoraComposer", () => {
  beforeEach(() => {
    setText.mockReset();
    send.mockReset();
    currentText = "";
  });

  it("merges transcripts into the existing composer text", async () => {
    currentText = "Add weight";
    const user = userEvent.setup();

    render(<MoraComposer />);

    await user.click(screen.getByRole("button", { name: "voice" }));

    expect(setText).toHaveBeenCalledWith("Add weight voice note");
    expect(send).not.toHaveBeenCalled();
  });

  it("trims transcript merges cleanly", () => {
    expect(mergeComposerTranscript("  hello ", "  world  ")).toBe("hello world");
    expect(mergeComposerTranscript("  ", "  world  ")).toBe("world");
    expect(mergeComposerTranscript("hello", "   ")).toBe("hello");
  });
});

