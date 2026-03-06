import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/MoraOrb", () => ({
  default: () => <span data-testid="mora-orb">orb</span>,
}));

import VoiceButton from "@/components/mora/VoiceButton";

type TrackMock = { stop: ReturnType<typeof vi.fn> };
type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

let getUserMediaMock: ReturnType<typeof vi.fn>;
let fetchMock: ReturnType<typeof vi.fn>;
let lastRecorder: FakeMediaRecorder | null = null;
let streamTracks: TrackMock[] = [];

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

class FakeMediaRecorder {
  static isTypeSupported(type: string) {
    return type.includes("webm");
  }

  state: "inactive" | "recording" = "inactive";
  stream: { getTracks: () => TrackMock[] };
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void | Promise<void>) | null = null;

  constructor(stream: { getTracks: () => TrackMock[] }) {
    this.stream = stream;
    lastRecorder = this;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    void this.onstop?.();
  }

  emitChunk(blob = new Blob(["audio"], { type: "audio/webm" })) {
    this.ondataavailable?.({ data: blob });
  }
}

describe("VoiceButton", () => {
  beforeEach(() => {
    streamTracks = [{ stop: vi.fn() }];
    getUserMediaMock = vi.fn(async () => ({
      getTracks: () => streamTracks,
    }));
    fetchMock = vi.fn(async () => ({
      json: async () => ({ text: "log 120ml formula" }),
    }));
    Object.defineProperty(globalThis, "fetch", { writable: true, value: fetchMock });
    Object.defineProperty(globalThis, "MediaRecorder", { writable: true, value: FakeMediaRecorder });
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: getUserMediaMock },
    });
  });

  it("records audio, transcribes it, and returns the transcript", async () => {
    const onTranscript = vi.fn();
    const user = userEvent.setup();
    const responseDeferred = createDeferred<{ json: () => Promise<{ text: string }> }>();
    fetchMock.mockImplementationOnce(() => responseDeferred.promise);

    render(<VoiceButton onTranscript={onTranscript} />);

    await user.click(screen.getByTitle("Voice input"));
    expect(getUserMediaMock).toHaveBeenCalledWith({ audio: true });
    expect(screen.getByText("Listening...")).toBeInTheDocument();

    lastRecorder?.emitChunk();
    await user.click(screen.getByTitle("Stop recording"));

    await waitFor(() => {
      expect(screen.getByText("Transcribing...")).toBeInTheDocument();
    });

    responseDeferred.resolve({
      json: async () => ({ text: "log 120ml formula" }),
    });

    await waitFor(() => {
      expect(onTranscript).toHaveBeenCalledWith("log 120ml formula");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/transcribe", expect.objectContaining({ method: "POST" }));
    expect(streamTracks[0].stop).toHaveBeenCalled();
  });

  it("shows microphone permission errors", async () => {
    getUserMediaMock.mockRejectedValueOnce({ name: "NotAllowedError" });
    const user = userEvent.setup();

    render(<VoiceButton onTranscript={vi.fn()} />);

    await user.click(screen.getByTitle("Voice input"));

    await waitFor(() => {
      expect(screen.getByText("Microphone permission denied")).toBeInTheDocument();
    });
  });
});
