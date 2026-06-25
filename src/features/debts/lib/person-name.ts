/**
 * Normalizes a person name for comparison: folds accents, collapses internal
 * whitespace, trims, and lowercases. Used for both the picker's live filter and
 * the exact-match guard that prevents accidental duplicate people.
 */
export function normalizePersonName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Whether two names refer to the same person under normalization. */
export function isSamePersonName(a: string, b: string): boolean {
  return normalizePersonName(a) === normalizePersonName(b);
}
