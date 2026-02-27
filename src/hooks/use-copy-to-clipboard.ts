"use client"

import { useState, useTransition } from "react"

export type CopyState = "idle" | "done" | "error"

export type UseCopyToClipboardOptions = {
  onCopySuccess?: (text: string) => void
  onCopyError?: (error: Error) => void
  resetDelay?: number
}

/**
 * Provides a React hook for writing text to the clipboard while exposing the current copy state.
 *
 * @param onCopySuccess - Optional callback invoked with the copied text after a successful copy.
 * @param onCopyError - Optional callback invoked with an `Error` when a copy attempt fails.
 * @param resetDelay - Time in milliseconds to wait before resetting the state back to `"idle"`; defaults to `1500`.
 * @returns An object with:
 *  - `state`: the current copy state (`"idle"`, `"done"`, or `"error"`).
 *  - `copy`: a function that accepts a `string` or a function returning a `string` and attempts to write it to the clipboard.
 */
export function useCopyToClipboard({
  onCopySuccess,
  onCopyError,
  resetDelay = 1500,
}: UseCopyToClipboardOptions = {}) {
  const [state, setState] = useState<CopyState>("idle")
  const [, startTransition] = useTransition()

  const copy = (text: string | (() => string)) => {
    startTransition(async () => {
      try {
        const finalText = typeof text === "function" ? text() : text
        await navigator.clipboard.writeText(finalText)
        setState("done")
        onCopySuccess?.(finalText)
      } catch (error) {
        setState("error")
        onCopyError?.(error instanceof Error ? error : new Error("Copy failed"))
      } finally {
        await new Promise((resolve) => setTimeout(resolve, resetDelay))
        setState("idle")
      }
    })
  }

  return { state, copy } as const
}
