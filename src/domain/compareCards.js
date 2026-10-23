import { manaValue } from './manaValue';

export const EXACT = 'exact';
export const PARTIAL = 'partial';
export const NONE = 'none';
export const HIGHER = 'higher';
export const LOWER = 'lower';

const NO_VALUE = '—';
const WUBRG = ['W', 'U', 'B', 'R', 'G'];
const RARITY_RANK = { COMMON: 0, UNCOMMON: 1, RARE: 2, MYTHIC: 3 };

const normalizeList = (list) => (list ?? []).map((item) => String(item).toUpperCase());

/**
 * Set-style hint: how many of the guessed items are in the target (matched / total)
 * and a status: EXACT when both sets are identical, NONE when nothing matches,
 * PARTIAL otherwise. An empty guess against a non-empty target is NONE.
 */
function compareSets(guessList, targetList) {
  const guess = [...new Set(normalizeList(guessList))];
  const target = new Set(normalizeList(targetList));
  const matched = guess.filter((item) => target.has(item)).length;
  const total = guess.length;
  const identical = total === target.size && matched === total;
  const status = identical ? EXACT : matched === 0 ? NONE : PARTIAL;
  return { matched, total, status };
}

/** Mana values within this distance of the target count as a partial (yellow) hint. */
export const CLOSE_MANA_VALUE = 2;

/**
 * Mana value hint: EXACT when equal, PARTIAL within CLOSE_MANA_VALUE of the target,
 * NONE otherwise; `direction` says whether the guess is LOWER or HIGHER than the target.
 */
function compareManaValue(guess, target) {
  if (guess === target) return { status: EXACT, direction: null };
  const status = Math.abs(guess - target) <= CLOSE_MANA_VALUE ? PARTIAL : NONE;
  return { status, direction: guess > target ? HIGHER : LOWER };
}

function compareRarity(guess, target) {
  const guessRarity = (guess ?? '').toUpperCase();
  const targetRarity = (target ?? '').toUpperCase();
  if (guessRarity && guessRarity === targetRarity) return EXACT;
  const guessRank = RARITY_RANK[guessRarity];
  const targetRank = RARITY_RANK[targetRarity];
  if (guessRank === undefined || targetRank === undefined) return NONE;
  return guessRank > targetRank ? HIGHER : LOWER;
}

/**
 * Set hint: EXACT for the same set, PARTIAL when the target's first set came out the
 * same year, NONE otherwise. `direction` (LOWER = guess printed before the target,
 * HIGHER = after) is kept separately so the arrow can show alongside the colour.
 */
function compareOriginalSet(guess, target) {
  const guessSet = (guess.originalPrintedSet ?? '').toUpperCase();
  const targetSet = (target.originalPrintedSet ?? '').toUpperCase();
  if (guessSet && guessSet === targetSet) return { status: EXACT, direction: null };
  if (!guess.firstPrintedAt || !target.firstPrintedAt) return { status: NONE, direction: null };
  const sameYear = guess.firstPrintedAt.slice(0, 4) === target.firstPrintedAt.slice(0, 4);
  const status = sameYear ? PARTIAL : NONE;
  if (guess.firstPrintedAt === target.firstPrintedAt) return { status, direction: null };
  return { status, direction: guess.firstPrintedAt > target.firstPrintedAt ? HIGHER : LOWER };
}

const titleCase = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
const displayRarity = (rarity) => (rarity ? titleCase(rarity) : NO_VALUE);
const unique = (list) => [...new Set(list ?? [])];
const displayWords = (list) => (unique(list).length ? unique(list).map((word) => titleCase(String(word))).join(' ') : NO_VALUE);
const displaySubtypes = (list) => (unique(list).length ? unique(list).join(' ') : NO_VALUE);
const splitColors = (colorIdentity) => WUBRG.filter((color) => (colorIdentity ?? '').toUpperCase().includes(color));
const typeLineWords = (card) => [...(card.surtypes ?? []), ...(card.types ?? [])];

/**
 * Compares a guessed card against the target card and returns, per hint
 * category, the guessed value to display and a status among
 * EXACT / PARTIAL / NONE / HIGHER / LOWER. The rarity status describes the guess
 * relative to the target: LOWER means the guess is more common than the target (so the
 * target is "rarer"), HIGHER the opposite. Mana value and set carry the colour in
 * `status` and the same LOWER / HIGHER meaning in a separate `direction`.
 * Set-style hints (colours, type line, subtypes) also carry matched / total counts.
 */
export function compareCards(guess, target) {
  const guessManaValue = manaValue(guess.manaCost);
  const targetManaValue = manaValue(target.manaCost);
  const guessColors = splitColors(guess.colorIdentity);
  const guessSet = guess.originalPrintedSet ?? null;

  return {
    correct: guess.name.trim().toLowerCase() === target.name.trim().toLowerCase(),
    name: guess.name,
    manaValue: { value: guessManaValue, ...compareManaValue(guessManaValue, targetManaValue) },
    colorIdentity: { value: guessColors, ...compareSets(guessColors, splitColors(target.colorIdentity)) },
    rarity: { value: displayRarity(guess.rarity), status: compareRarity(guess.rarity, target.rarity) },
    typeLine: { value: displayWords(typeLineWords(guess)), ...compareSets(typeLineWords(guess), typeLineWords(target)) },
    subtypes: { value: displaySubtypes(guess.subtypes), ...compareSets(guess.subtypes, target.subtypes) },
    originalPrintedSet: {
      value: guessSet ? guessSet.toUpperCase() : NO_VALUE,
      code: guessSet ? guessSet.toLowerCase() : null,
      name: guess.originalPrintedSetName ?? null,
      year: guess.firstPrintedAt ? guess.firstPrintedAt.slice(2, 4) : null,
      date: guess.firstPrintedAt ?? null,
      ...compareOriginalSet(guess, target),
    },
  };
}
