const words = (text) =>
  text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean);

/**
 * Word-prefix search over card names: every word of the query must be the
 * beginning of some word of the name ("titan" finds "Grave Titan", "itan" does
 * not). Names that start with the query come first, then alphabetical order.
 * All matches are returned unless a limit is given.
 */
export function searchNames(names, query, limit = Infinity) {
  const tokens = words(query ?? '');
  if (tokens.length === 0) return [];
  const normalizedQuery = tokens.join(' ');

  const matches = names.filter((name) => {
    const nameWords = words(name);
    return tokens.every((token) => nameWords.some((word) => word.startsWith(token)));
  });

  const startsWithQuery = (name) => words(name).join(' ').startsWith(normalizedQuery);
  return matches
    .sort((a, b) => {
      const aFirst = startsWithQuery(a);
      const bFirst = startsWithQuery(b);
      if (aFirst !== bFirst) return aFirst ? -1 : 1;
      return a.localeCompare(b, 'en', { sensitivity: 'base' });
    })
    .slice(0, limit);
}
