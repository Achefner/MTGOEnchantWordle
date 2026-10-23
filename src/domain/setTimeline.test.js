import { selectTimelineSets, classifySets, POSSIBLE, EXCLUDED, MATCH } from './setTimeline';
import { EXACT, PARTIAL, NONE, HIGHER, LOWER } from './compareCards';

const lea = { code: 'lea', name: 'Limited Edition Alpha', type: 'core', releasedAt: '1993-08-05', cardCount: 290 };
const rtr = { code: 'rtr', name: 'Return to Ravnica', type: 'expansion', releasedAt: '2012-10-05', cardCount: 274 };
const c13 = { code: 'c13', name: 'Commander 2013', type: 'commander', releasedAt: '2013-11-01', cardCount: 51 };
const znr = { code: 'znr', name: 'Zendikar Rising', type: 'expansion', releasedAt: '2020-09-25', cardCount: 280 };
const znc = { code: 'znc', name: 'Zendikar Rising Commander', type: 'commander', releasedAt: '2020-09-25', cardCount: 12 };
const mom = { code: 'mom', name: 'March of the Machine', type: 'expansion', releasedAt: '2023-04-21', cardCount: 281 };
const pmom = { code: 'pmom', name: 'March of the Machine Promos', type: 'promo', releasedAt: '2023-04-14', cardCount: 3 };
const tiny = { code: 'tiny', name: 'Tiny Expansion', type: 'expansion', releasedAt: '2001-01-01', cardCount: 4 };
const undated = { code: 'und', name: 'Undated', type: 'expansion', releasedAt: null, cardCount: 50 };
const tokens = { code: 'tznr', name: 'Zendikar Rising Tokens', type: 'token', releasedAt: '2020-09-25', cardCount: 20 };

const setHint = (code, date, status, direction = null) => ({ originalPrintedSet: { code, date, status, direction } });

describe('selectTimelineSets', () => {
  it('keeps regular sets with enough first printings, in chronological order', () => {
    const result = selectTimelineSets([mom, tokens, znr, pmom, tiny, undated, lea, c13, rtr]);
    expect(result.map((s) => s.code)).toEqual(['lea', 'rtr', 'c13', 'znr', 'mom']);
  });
  it('breaks same-day ties by code', () => {
    expect(selectTimelineSets([znr, znc]).map((s) => s.code)).toEqual(['znc', 'znr']);
  });
});

describe('classifySets', () => {
  const sets = [lea, rtr, c13, znr, znc, mom];

  it('marks every set possible when there are no guesses', () => {
    const result = classifySets(sets, []);
    expect(Object.values(result)).toEqual(Array(6).fill(POSSIBLE));
  });

  it('excludes sets released on or before a guess printed earlier than the target', () => {
    const result = classifySets(sets, [setHint('rtr', '2012-10-05', NONE, LOWER)]);
    expect(result).toEqual({ lea: EXCLUDED, rtr: EXCLUDED, c13: POSSIBLE, znr: POSSIBLE, znc: POSSIBLE, mom: POSSIBLE });
  });

  it('excludes sets released on or after a guess printed later than the target', () => {
    const result = classifySets(sets, [setHint('znr', '2020-09-25', NONE, HIGHER)]);
    expect(result).toEqual({ lea: POSSIBLE, rtr: POSSIBLE, c13: POSSIBLE, znr: EXCLUDED, znc: EXCLUDED, mom: EXCLUDED });
  });

  it('combines several guesses into a window', () => {
    const result = classifySets(sets, [setHint('lea', '1993-08-05', NONE, LOWER), setHint('znr', '2020-09-25', NONE, HIGHER)]);
    expect(result).toEqual({ lea: EXCLUDED, rtr: POSSIBLE, c13: POSSIBLE, znr: EXCLUDED, znc: EXCLUDED, mom: EXCLUDED });
  });

  it('keeps only other sets of the same year after a PARTIAL hint without direction', () => {
    const result = classifySets(sets, [setHint('znr', '2020-09-25', PARTIAL)]);
    expect(result).toEqual({ lea: EXCLUDED, rtr: EXCLUDED, c13: EXCLUDED, znr: EXCLUDED, znc: POSSIBLE, mom: EXCLUDED });
  });

  it('keeps only same-year sets on the right side of the date after a PARTIAL hint with direction', () => {
    const m13 = { code: 'm13', name: 'Magic 2013', type: 'core', releasedAt: '2012-07-13', cardCount: 100 };
    const gtc = { code: 'gtc', name: 'Gatecrash', type: 'expansion', releasedAt: '2013-02-01', cardCount: 249 };
    const result = classifySets([m13, rtr, gtc, znr], [setHint('m13', '2012-07-13', PARTIAL, LOWER)]);
    expect(result).toEqual({ m13: EXCLUDED, rtr: POSSIBLE, gtc: EXCLUDED, znr: EXCLUDED });
  });

  it('marks the set as a match and excludes the rest after an EXACT hint', () => {
    const result = classifySets(sets, [setHint('rtr', '2012-10-05', EXACT)]);
    expect(result).toEqual({ lea: EXCLUDED, rtr: MATCH, c13: EXCLUDED, znr: EXCLUDED, znc: EXCLUDED, mom: EXCLUDED });
  });

  it('ignores hints without a date', () => {
    const result = classifySets(sets, [setHint(null, null, NONE)]);
    expect(Object.values(result)).toEqual(Array(6).fill(POSSIBLE));
  });
});
