import type { ReactNode } from "react";

type DataStateProps<T> = {
  value: T | undefined;
  children: (value: T) => ReactNode;
  loadingFallback?: ReactNode;
  emptyFallback?: ReactNode;
  isEmpty?: (value: T) => boolean;
};

/**
 * Determines whether a value should be considered empty.
 *
 * @param value - The value to test for emptiness
 * @returns `true` if `value` is `null` or `undefined`, an array with length 0, or an object with no own enumerable keys; `false` otherwise
 */
function defaultIsEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return false;
}

/**
 * Selects and renders a loading, empty, or content branch based on the provided value.
 *
 * @param value - The data to evaluate; `undefined` signals the loading branch.
 * @param children - Render-prop invoked with `value` when it is present and not empty.
 * @param loadingFallback - Node rendered when `value` is `undefined`.
 * @param emptyFallback - Node rendered when `isEmpty(value)` returns `true`.
 * @param isEmpty - Predicate that determines whether `value` should be treated as empty.
 * @returns The React element for the active branch: `loadingFallback`, `emptyFallback`, or the result of `children(value)`.
 */
export function DataState<T>({
  value,
  children,
  loadingFallback = null,
  emptyFallback = null,
  isEmpty = defaultIsEmpty,
}: DataStateProps<T>) {
  if (value === undefined) {
    return <>{loadingFallback}</>;
  }

  if (isEmpty(value)) {
    return <>{emptyFallback}</>;
  }

  return <>{children(value)}</>;
}

