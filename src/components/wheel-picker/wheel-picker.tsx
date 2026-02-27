import "@ncdai/react-wheel-picker/style.css"

import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type WheelPickerValue = WheelPickerPrimitive.WheelPickerValue

type WheelPickerOption<T extends WheelPickerValue = string> =
  WheelPickerPrimitive.WheelPickerOption<T>

type WheelPickerClassNames = WheelPickerPrimitive.WheelPickerClassNames

/**
 * Render a WheelPickerWrapper preconfigured with the component's default visual styles.
 *
 * The returned element merges the component's base class names with the optional `className`
 * prop and forwards all other props to the underlying primitive.
 *
 * @returns The configured WheelPickerWrapper element with merged styling and forwarded props
 */
function WheelPickerWrapper({
  className,
  ...props
}: ComponentProps<typeof WheelPickerPrimitive.WheelPickerWrapper>) {
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn(
        "w-56 rounded-lg border border-muted/10 bg-oat/40 px-1 shadow-xs",
        "*:data-rwp:first:*:data-rwp-highlight-wrapper:rounded-s-md",
        "*:data-rwp:last:*:data-rwp-highlight-wrapper:rounded-e-md",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a WheelPicker with default visual classNames merged with any provided overrides.
 *
 * @template T - Item value type (defaults to `string`)
 * @param classNames - Partial mapping of class name overrides. Provided entries are merged with the component's defaults for `optionItem`, `highlightWrapper`, and `highlightItem`.
 * @returns A JSX element rendering the underlying WheelPicker with the merged class name mappings.
 */
function WheelPicker<T extends WheelPickerValue = string>({
  classNames,
  ...props
}: WheelPickerPrimitive.WheelPickerProps<T>) {
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        optionItem: cn(
          "text-espresso/40 data-disabled:opacity-30",
          classNames?.optionItem
        ),
        highlightWrapper: cn(
          "bg-white text-espresso",
          "data-rwp-focused:ring-2 data-rwp-focused:ring-sage/40 data-rwp-focused:ring-inset",
          classNames?.highlightWrapper
        ),
        highlightItem: cn(
          "data-disabled:opacity-40",
          classNames?.highlightItem
        ),
      }}
      {...props}
    />
  )
}

export { WheelPicker, WheelPickerWrapper }
export type { WheelPickerClassNames, WheelPickerOption }
