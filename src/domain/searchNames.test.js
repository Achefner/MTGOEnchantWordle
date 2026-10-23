import { searchNames } from './searchNames';

const names = [
  'Grave Titan',
  'Titanic Growth',
  'Sun Titan',
  'Primeval Titan',
  'Inferno Titan',
  'Frost Titan',
  'Titania, Protector of Argoth',
  "Jace, Vryn's Prodigy",
  'Lightning Bolt',
  '"Ach! Hans, Run!"',
  'Titan of Industry',
  'Titan Forge',
  'Titan Hunter',
];

describe('searchNames', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(searchNames(names, '')).toEqual([]);
    expect(searchNames(names, '   ')).toEqual([]);
  });

  it('matches when any word of the name starts with the query', () => {
    expect(searchNames(names, 'titan')).toEqual(expect.arrayContaining(['Grave Titan', 'Titanic Growth', 'Sun Titan']));
  });

  it('does not match inside a word', () => {
    expect(searchNames(names, 'itan')).toEqual([]);
    expect(searchNames(names, 'rave')).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(searchNames(names, 'LIGHT')).toEqual(['Lightning Bolt']);
  });

  it('requires every query word to prefix some word of the name', () => {
    expect(searchNames(names, 'grave t')).toEqual(['Grave Titan']);
    expect(searchNames(names, 'titan gr')).toEqual(['Grave Titan', 'Titanic Growth']);
    expect(searchNames(names, 'grave x')).toEqual([]);
  });

  it('ignores punctuation around words', () => {
    expect(searchNames(names, 'jace, vryn')).toEqual(["Jace, Vryn's Prodigy"]);
    expect(searchNames(names, "vryn's")).toEqual(["Jace, Vryn's Prodigy"]);
    expect(searchNames(names, 'ach hans')).toEqual(['"Ach! Hans, Run!"']);
  });

  it('lists names starting with the query first, then alphabetically, capped by an optional limit', () => {
    const result = searchNames(names, 'titan', 5);
    expect(result).toHaveLength(5);
    expect(result.slice(0, 5)).toEqual(['Titan Forge', 'Titan Hunter', 'Titan of Industry', 'Titania, Protector of Argoth', 'Titanic Growth']);
  });

  it('returns every match when no limit is given', () => {
    expect(searchNames(names, 'titan')).toHaveLength(10);
  });
});
