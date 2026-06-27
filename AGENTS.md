# Agent instructions

## Expo

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Performance & scaling

**Read [docs/performance.md](./docs/performance.md) before touching list screens, repositories, query hooks, or view mappers.**

Owed must stay fast with hundreds of debts and activity events. Follow the patterns in that doc:

- List debts → `listSummaries()` + `DebtSummary` (no payments). Detail → `getById()` only.
- Long lists → `FlashList` (`DebtList`, `ActivityList`). Not `ScrollView` + `.map()`.
- Queries → `staleTime: Infinity`, hooks read repositories and map to views, prefetch imports shared `load*` from hooks, invalidate on mutation only.
- Screen derivations → `debt-list-utils.ts` single-pass + `useMemo`.

Verify with Settings → Developer → Seed sample data (dev builds) before merging list/data work.
