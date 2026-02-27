## Convex `useQuery` loading vs empty pattern

Convex React hooks return **`undefined` while loading** and the concrete value once the first response arrives. In this codebase we standardize on:

- **Loading**: `value === undefined`
- **Empty**: domain-specific `isEmpty(value)` (for example, arrays with `length === 0`)
- **Ready**: everything else

### Recommended usage

- Never treat a falsy value (`!value`) as \"no data\" for Convex queries; always distinguish `undefined` explicitly.
- Prefer the shared `DataState` helper from `src/components/DataState.tsx` for new code:

```tsx
<DataState
  value={result}
  loadingFallback={<Skeleton />}
  emptyFallback={<EmptyState />}
>
  {(data) => <UI data={data} />}
</DataState>
```

- For simple one-off spots, a direct check is fine:

```tsx
if (items === undefined) {
  return <SkeletonList />;
}
if (!items.length) {
  return <EmptyState />;
}
return <List items={items} />;
```

