"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";
import confetti from "canvas-confetti";
import type {
  CreateTypes as ConfettiInstance,
  GlobalOptions as ConfettiGlobalOptions,
  Options as ConfettiOptions,
} from "canvas-confetti";

const DEFAULT_GLOBAL_OPTIONS = {
  resize: true,
  useWorker: true,
} satisfies ConfettiGlobalOptions;

type ConfettiApi = {
  fire: (options?: ConfettiOptions) => Promise<void>;
};

type ConfettiProps = ComponentPropsWithoutRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
};

export type ConfettiRef = ConfettiApi | null;

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(function Confetti(
  { options, globalOptions = DEFAULT_GLOBAL_OPTIONS, manualstart = false, ...props },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const instanceRef = useRef<ConfettiInstance | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      async fire(overrideOptions: ConfettiOptions = {}) {
        try {
          await instanceRef.current?.({ ...options, ...overrideOptions });
        } catch (error) {
          console.error("Confetti error:", error);
        }
      },
    }),
    [options]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const instance = confetti.create(canvas, {
      ...globalOptions,
      resize: true,
    });

    instanceRef.current = instance;

    return () => {
      instance.reset();
      instanceRef.current = null;
    };
  }, [globalOptions]);

  useEffect(() => {
    if (manualstart) return;

    void (async () => {
      try {
        await instanceRef.current?.(options ?? {});
      } catch (error) {
        console.error("Confetti error:", error);
      }
    })();
  }, [manualstart, options]);

  return <canvas ref={canvasRef} {...props} />;
});

Confetti.displayName = "Confetti";
