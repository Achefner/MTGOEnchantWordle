import { manaValue } from './manaValue';

describe('manaValue', () => {
  it('returns 0 for null, undefined or empty mana cost (lands)', () => {
    expect(manaValue(null)).toBe(0);
    expect(manaValue(undefined)).toBe(0);
    expect(manaValue('')).toBe(0);
  });

  it('sums generic and colored symbols', () => {
    expect(manaValue('{3}{G}')).toBe(4);
    expect(manaValue('{U}{U}')).toBe(2);
    expect(manaValue('{3}{W}{W}')).toBe(5);
  });

  it('counts {0} as zero', () => {
    expect(manaValue('{0}')).toBe(0);
  });

  it('counts X as zero', () => {
    expect(manaValue('{X}{R}')).toBe(1);
    expect(manaValue('{X}{X}{G}')).toBe(1);
  });

  it('counts hybrid symbols as one', () => {
    expect(manaValue('{W/U}{W/U}')).toBe(2);
  });

  it('counts two-generic hybrid symbols as two', () => {
    expect(manaValue('{2/W}{2/W}')).toBe(4);
  });

  it('counts phyrexian and colorless symbols as one', () => {
    expect(manaValue('{G/P}{G/P}')).toBe(2);
    expect(manaValue('{C}{C}')).toBe(2);
  });

  it('counts snow symbol as one', () => {
    expect(manaValue('{S}')).toBe(1);
  });
});
