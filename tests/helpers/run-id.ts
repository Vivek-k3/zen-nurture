export function createRunId(prefix = "test") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createUniqueTitle(prefix: string) {
  return `${prefix} ${createRunId()}`;
}

