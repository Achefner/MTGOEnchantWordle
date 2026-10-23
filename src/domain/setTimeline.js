import { EXACT, PARTIAL, HIGHER, LOWER } from './compareCards';

export const POSSIBLE = 'possible';
export const EXCLUDED = 'excluded';
export const MATCH = 'match';

/** Set types that make up the timeline: regular products in which new cards are released. */
export const TIMELINE_SET_TYPES = ['core', 'expansion', 'commander', 'draft_innovation', 'masters', 'starter'];
/** Sets with fewer first printings than this (promos, odd supplements) are left out. */
export const MIN_FIRST_PRINTINGS = 10;

/** Filters the sets worth showing on the timeline and orders them chronologically. */
export function selectTimelineSets(sets) {
  return (sets ?? [])
    .filter((set) => set.releasedAt && TIMELINE_SET_TYPES.includes(set.type) && set.cardCount >= MIN_FIRST_PRINTINGS)
    .sort((a, b) => a.releasedAt.localeCompare(b.releasedAt) || a.code.localeCompare(b.code));
}

/**
 * Uses the set hints of the guesses so far to tell, per set code, whether the
 * target card can still have been first printed in that set.
 */
export function classifySets(sets, guesses) {
  const hints = (guesses ?? []).map((feedback) => feedback.originalPrintedSet).filter((hint) => hint && hint.date);
  const result = {};
  for (const set of sets) {
    result[set.code] = hints.every((hint) => stillPossible(set, hint)) ? POSSIBLE : EXCLUDED;
    if (hints.some((hint) => hint.status === EXACT && hint.code === set.code)) result[set.code] = MATCH;
  }
  return result;
}

function stillPossible(set, hint) {
  if (hint.status === EXACT) return set.code === hint.code;
  if (hint.status === PARTIAL) {
    // Same year as the guess, but not the guessed set itself.
    if (set.releasedAt.slice(0, 4) !== hint.date.slice(0, 4) || set.code === hint.code) return false;
  }
  if (hint.direction === LOWER) return set.releasedAt > hint.date; // target is later
  if (hint.direction === HIGHER) return set.releasedAt < hint.date; // target is earlier
  return true;
}
