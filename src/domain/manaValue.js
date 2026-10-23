/**
 * Computes the mana value (converted mana cost) of a Scryfall-style mana cost
 * string such as "{3}{G}", "{X}{R}" or "{2/W}{2/W}".
 *
 * Rules:
 *  - a generic number {N} contributes N
 *  - {X} contributes 0
 *  - any colored, colorless {C}, snow {S}, phyrexian {G/P} or hybrid {W/U}
 *    symbol contributes 1
 *  - a two-generic hybrid symbol {2/W} contributes 2
 *  - null / empty cost (lands) is 0
 */
export function manaValue(manaCost) {
  if (!manaCost) return 0;
  const symbols = manaCost.match(/\{([^}]+)\}/g) ?? [];
  return symbols.reduce((total, symbol) => total + symbolValue(symbol.slice(1, -1)), 0);
}

function symbolValue(symbol) {
  const parts = symbol.split('/');
  const generic = parts.find((part) => /^\d+$/.test(part));
  if (generic !== undefined) return Number(generic);
  if (parts.every((part) => part.toUpperCase() === 'X' || part.toUpperCase() === 'Y' || part.toUpperCase() === 'Z')) return 0;
  return 1;
}
