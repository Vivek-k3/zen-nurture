"use client"

import { CheckIcon, CircleXIcon, CopyIcon } from "lucide-react"
import type { HTMLMotionProps, Variants } from "motion/react"
import { AnimatePresence, motion } from "motion/react"
import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import type { CopyState } from "@/hooks/use-copy-to-clipboard"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export const motionIconVariants: Variants = {
  initial: { opacity: 0, scale: 0.8, filter: "blur(2px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.8 },
}

export const motionIconProps: HTMLMotionProps<"span"> = {
  variants: motionIconVariants,
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: { duration: 0.15, ease: "easeOut" },
}

/**
 * Renders the icon that represents the current copy operation state.
 *
 * @param state - The current copy state: `"idle"` shows the copy icon, `"done"` shows the success check icon, and `"error"` shows the error icon.
 * @returns The React element for the icon corresponding to `state`, wrapped to enable animated transitions.
 */
export function CopyStateIcon({ state }: { state: CopyState }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {state === "idle" ? (
        <motion.span key="idle" {...motionIconProps}>
          <CopyIcon />
        </motion.span>
      ) : state === "done" ? (
        <motion.span key="done" {...motionIconProps}>
          <CheckIcon strokeWidth={3} />
        </motion.span>
      ) : state === "error" ? (
        <motion.span key="error" {...motionIconProps}>
          <CircleXIcon />
        </motion.span>
      ) : null}
    </AnimatePresence>
  )
}

export type CopyButtonOwnProps = {
  /** The text to copy, or a function that returns the text. */
  text: string | (() => string)
  /** Called with the copied text on successful copy. */
  onCopySuccess?: (text: string) => void
  /** Called with the error if the copy operation fails. */
  onCopyError?: (error: Error) => void
}

export type CopyButtonProps = ComponentProps<typeof Button> & CopyButtonOwnProps

/**
 * Renders a button that copies provided text to the clipboard and shows an animated state icon.
 *
 * The button triggers a copy action when clicked, displays an icon reflecting the copy state
 * (idle, success, error), and forwards other Button props.
 *
 * @param text - The string to copy, or a function that returns the string to copy when invoked.
 * @param onCopySuccess - Called with the copied text after a successful copy operation.
 * @param onCopyError - Called with an Error if the copy operation fails.
 */
export function CopyButton({
  size = "icon",
  children,
  text,
  onCopySuccess,
  onCopyError,
  onClick,
  ...props
}: CopyButtonProps) {
  const { state, copy } = useCopyToClipboard({
    onCopySuccess,
    onCopyError,
  })

  return (
    <Button
      size={size}
      onClick={(e) => {
        copy(text)
        onClick?.(e)
      }}
      aria-label="Copy"
      {...props}
    >
      <CopyStateIcon state={state} />
      {children}
    </Button>
  )
}
