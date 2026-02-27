import type { ReactNode } from "react";

type DataStateProps<T> = {
  value: T | undefined;
  children: (value: T) => ReactNode;
  loadingFallback?: ReactNode;
  emptyFallback?: ReactNode;
  isEmpty?: (value: T) => boolean;
};

function defaultIsEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return false;
}

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

