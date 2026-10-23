import { compareCards, EXACT, PARTIAL, NONE, HIGHER, LOWER } from './compareCards';

const target = {
  name: 'Serra Angel',
  manaCost: '{3}{W}{W}',
  types: ['CREATURE'],
  surtypes: [],
  subtypes: ['Angel'],
  colorIdentity: 'W',
  sets: ['lea', 'm15'],
  originalPrintedSet: 'lea',
  originalPrintedSetName: 'Limited Edition Alpha',
  originalPrintedSetType: 'core',
  firstPrintedAt: '1993-08-05',
  rarity: 'UNCOMMON',
};

describe('compareCards', () => {
  it('flags a correct guess when names match ignoring case', () => {
    const result = compareCards({ ...target, name: 'serra angel' }, target);
    expect(result.correct).toBe(true);
  });

  it('flags an incorrect guess when names differ', () => {
    const guess = { ...target, name: 'Llanowar Elves' };
    expect(compareCards(guess, target).correct).toBe(false);
  });

  describe('colour identity', () => {
    it('is EXACT when identical, with every colour matched', () => {
      const r = compareCards(target, target).colorIdentity;
      expect(r.status).toBe(EXACT);
      expect(r.matched).toBe(1);
      expect(r.total).toBe(1);
    });
    it('is PARTIAL with the share of guessed colours found in the target', () => {
      const guess = { ...target, colorIdentity: 'BGRUW' };
      const r = compareCards(guess, target).colorIdentity;
      expect(r.status).toBe(PARTIAL);
      expect(r.matched).toBe(1);
      expect(r.total).toBe(5);
    });
    it('is NONE when no guessed colour is in the target', () => {
      const guess = { ...target, colorIdentity: 'GRUW' };
      const r = compareCards(guess, { ...target, colorIdentity: 'B' }).colorIdentity;
      expect(r.status).toBe(NONE);
      expect(r.matched).toBe(0);
      expect(r.total).toBe(4);
    });
    it('is PARTIAL when the guess is a strict subset of the target (all guessed colours match)', () => {
      const guess = { ...target, colorIdentity: 'W' };
      const r = compareCards(guess, { ...target, colorIdentity: 'WU' }).colorIdentity;
      expect(r.status).toBe(PARTIAL);
      expect(r.matched).toBe(1);
      expect(r.total).toBe(1);
    });
    it('treats two colorless cards as EXACT', () => {
      const a = { ...target, colorIdentity: '' };
      const r = compareCards(a, a).colorIdentity;
      expect(r.status).toBe(EXACT);
      expect(r.total).toBe(0);
    });
    it('is NONE for a colorless guess against a coloured target', () => {
      const r = compareCards({ ...target, colorIdentity: '' }, target).colorIdentity;
      expect(r.status).toBe(NONE);
      expect(r.total).toBe(0);
    });
    it('lists the guessed colours in WUBRG order', () => {
      const guess = { ...target, colorIdentity: 'BGRUW' };
      expect(compareCards(guess, target).colorIdentity.value).toEqual(['W', 'U', 'B', 'R', 'G']);
      expect(compareCards({ ...target, colorIdentity: '' }, target).colorIdentity.value).toEqual([]);
    });
  });

  describe('type / supertype', () => {
    it('is EXACT when the same supertypes and types, shown as one readable line', () => {
      const guess = { ...target, surtypes: ['LEGENDARY'], types: ['ARTIFACT', 'CREATURE'] };
      const r = compareCards(guess, guess).typeLine;
      expect(r.status).toBe(EXACT);
      expect(r.value).toBe('Legendary Artifact Creature');
      expect(r.matched).toBe(3);
      expect(r.total).toBe(3);
    });
    it('is PARTIAL with the share of guessed words found in the target', () => {
      const guess = { ...target, surtypes: ['LEGENDARY'], types: ['CREATURE'] };
      const r = compareCards(guess, target).typeLine;
      expect(r.status).toBe(PARTIAL);
      expect(r.matched).toBe(1);
      expect(r.total).toBe(2);
    });
    it('is NONE on no overlap', () => {
      const r = compareCards({ ...target, types: ['INSTANT'] }, target).typeLine;
      expect(r.status).toBe(NONE);
      expect(r.matched).toBe(0);
    });
    it('ignores ordering', () => {
      const guess = { ...target, types: ['CREATURE', 'ARTIFACT'] };
      const t = { ...target, types: ['ARTIFACT', 'CREATURE'] };
      expect(compareCards(guess, t).typeLine.status).toBe(EXACT);
    });
    it('shows each word once even if the data repeats it', () => {
      const guess = { ...target, surtypes: [], types: ['SORCERY', 'SORCERY'] };
      const r = compareCards(guess, { ...target, surtypes: [], types: ['SORCERY'] }).typeLine;
      expect(r.value).toBe('Sorcery');
      expect(r.status).toBe(EXACT);
      expect(r.total).toBe(1);
    });
    it('does not expose separate types or surtypes hints', () => {
      const r = compareCards(target, target);
      expect(r.types).toBeUndefined();
      expect(r.surtypes).toBeUndefined();
    });
  });

  describe('subtypes', () => {
    it('is EXACT / PARTIAL / NONE with matched counts', () => {
      expect(compareCards(target, target).subtypes).toMatchObject({ status: EXACT, matched: 1, total: 1, value: 'Angel' });
      expect(compareCards({ ...target, subtypes: ['Angel', 'Cleric'] }, target).subtypes).toMatchObject({ status: PARTIAL, matched: 1, total: 2, value: 'Angel Cleric' });
      expect(compareCards({ ...target, subtypes: ['Elf'] }, target).subtypes).toMatchObject({ status: NONE, matched: 0, total: 1 });
    });
    it('shows repeated subtypes once', () => {
      const guess = { ...target, subtypes: ['Werewolf', 'Human', 'Werewolf'] };
      expect(compareCards(guess, target).subtypes).toMatchObject({ value: 'Werewolf Human', total: 2 });
    });
    it('two empty subtype lists are EXACT and shown as a dash', () => {
      const a = { ...target, subtypes: [] };
      expect(compareCards(a, a).subtypes).toMatchObject({ status: EXACT, total: 0, value: '—' });
    });
    it('an empty guess against a target with subtypes is NONE', () => {
      expect(compareCards({ ...target, subtypes: [] }, target).subtypes.status).toBe(NONE);
    });
  });

  describe('mana value', () => {
    const manaHint = (cost, targetCost = '{G}') => compareCards({ ...target, manaCost: cost }, { ...target, manaCost: targetCost }).manaValue;

    it('is EXACT with no direction when equal', () => {
      const r = compareCards(target, target).manaValue;
      expect(r).toMatchObject({ status: EXACT, direction: null, value: 5 });
    });
    it('is PARTIAL within two of the target, with the direction', () => {
      expect(manaHint('{0}')).toMatchObject({ status: PARTIAL, direction: LOWER });
      expect(manaHint('{1}{G}')).toMatchObject({ status: PARTIAL, direction: HIGHER });
      expect(manaHint('{2}{G}')).toMatchObject({ status: PARTIAL, direction: HIGHER });
    });
    it('is NONE three or more away, with the direction', () => {
      expect(manaHint('{3}{G}')).toMatchObject({ status: NONE, direction: HIGHER });
      expect(manaHint('{G}', '{6}{W}')).toMatchObject({ status: NONE, direction: LOWER });
    });
  });

  it('does not produce power or toughness hints', () => {
    const result = compareCards(target, target);
    expect(result.power).toBeUndefined();
    expect(result.toughness).toBeUndefined();
  });

  describe('rarity', () => {
    it('is EXACT when equal and shows a readable value', () => {
      const r = compareCards(target, target).rarity;
      expect(r.status).toBe(EXACT);
      expect(r.value).toBe('Uncommon');
    });
    it('is LOWER when the guess is more common than the target (target is rarer)', () => {
      expect(compareCards({ ...target, rarity: 'COMMON' }, target).rarity.status).toBe(LOWER);
    });
    it('is HIGHER when the guess is rarer than the target', () => {
      expect(compareCards({ ...target, rarity: 'MYTHIC' }, target).rarity.status).toBe(HIGHER);
      expect(compareCards({ ...target, rarity: 'RARE' }, target).rarity.status).toBe(HIGHER);
    });
    it('is NONE when a rarity cannot be ranked', () => {
      expect(compareCards({ ...target, rarity: 'SPECIAL' }, target).rarity.status).toBe(NONE);
      expect(compareCards({ ...target, rarity: null }, target).rarity.status).toBe(NONE);
      expect(compareCards({ ...target, rarity: null }, target).rarity.value).toBe('—');
    });
    it('is EXACT for two identical unranked rarities', () => {
      const a = { ...target, rarity: 'SPECIAL' };
      expect(compareCards(a, a).rarity.status).toBe(EXACT);
    });
  });

  describe('original printed set', () => {
    const setHint = (guess, t = target) => compareCards(guess, t).originalPrintedSet;

    it('is EXACT when same set, compared case-insensitively, and shows code, name, year and date', () => {
      const r = setHint({ ...target, originalPrintedSet: 'LEA' });
      expect(r.status).toBe(EXACT);
      expect(r.direction).toBeNull();
      expect(r.value).toBe('LEA');
      expect(r.code).toBe('lea');
      expect(r.name).toBe('Limited Edition Alpha');
      expect(r.year).toBe('93');
      expect(r.date).toBe('1993-08-05');
    });
    it('points later (LOWER) when the guess was first printed before the target, NONE when years differ', () => {
      const later = { ...target, originalPrintedSet: 'm15', firstPrintedAt: '2014-07-18' };
      const r = setHint({ ...target, originalPrintedSet: 'lea', firstPrintedAt: '1993-08-05' }, later);
      expect(r.status).toBe(NONE);
      expect(r.direction).toBe(LOWER);
    });
    it('points earlier (HIGHER) when the guess was first printed after the target', () => {
      const r = setHint({ ...target, originalPrintedSet: 'm15', firstPrintedAt: '2014-07-18' });
      expect(r.status).toBe(NONE);
      expect(r.direction).toBe(HIGHER);
    });
    it('is PARTIAL with a direction when a different set came out the same year', () => {
      const rtr = { ...target, originalPrintedSet: 'rtr', firstPrintedAt: '2012-10-05' };
      const avr = { ...target, originalPrintedSet: 'avr', firstPrintedAt: '2012-05-04' };
      expect(setHint(avr, rtr)).toMatchObject({ status: PARTIAL, direction: LOWER });
      expect(setHint(rtr, avr)).toMatchObject({ status: PARTIAL, direction: HIGHER });
    });
    it('is PARTIAL without a direction when different sets were released the same day', () => {
      const r = setHint({ ...target, originalPrintedSet: 'c14', firstPrintedAt: '1993-08-05' });
      expect(r.status).toBe(PARTIAL);
      expect(r.direction).toBeNull();
    });
    it('is NONE without a direction when a release date is missing', () => {
      const r = setHint({ ...target, originalPrintedSet: 'prm', firstPrintedAt: null });
      expect(r.status).toBe(NONE);
      expect(r.direction).toBeNull();
    });
    it('shows dashes when the guess has no first set', () => {
      const r = setHint({ ...target, originalPrintedSet: null, originalPrintedSetName: null, firstPrintedAt: null });
      expect(r.value).toBe('—');
      expect(r.code).toBeNull();
      expect(r.year).toBeNull();
      expect(r.status).toBe(NONE);
    });
  });
});
