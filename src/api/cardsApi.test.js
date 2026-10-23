import { fetchRandomCard, fetchCardByName, fetchCardNames, fetchSets, CardNotFoundError } from './cardsApi';

const BASE = 'http://api.test';

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe('fetchRandomCard', () => {
  it('GETs /api/cards/random and returns the card', async () => {
    const card = { id: '1', name: 'Serra Angel' };
    global.fetch.mockResolvedValue(jsonResponse(card));

    await expect(fetchRandomCard(BASE)).resolves.toEqual(card);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/api/cards/random`, expect.objectContaining({ headers: { Accept: 'application/json' } }));
  });

  it('throws on a non-2xx response', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, 500));
    await expect(fetchRandomCard(BASE)).rejects.toThrow(/500/);
  });
});

describe('fetchCardByName', () => {
  it('GETs /api/cards/{name} with the name URL-encoded', async () => {
    const card = { id: '2', name: "Jace, Vryn's Prodigy" };
    global.fetch.mockResolvedValue(jsonResponse(card));

    await expect(fetchCardByName("Jace, Vryn's Prodigy", BASE)).resolves.toEqual(card);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/api/cards/${encodeURIComponent("Jace, Vryn's Prodigy")}`, expect.anything());
  });

  it('throws CardNotFoundError on 404', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, 404));
    await expect(fetchCardByName('Nope', BASE)).rejects.toBeInstanceOf(CardNotFoundError);
  });

  it('throws a generic error on other failures', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, 503));
    const error = await fetchCardByName('Nope', BASE).catch((e) => e);
    expect(error).not.toBeInstanceOf(CardNotFoundError);
    expect(error.message).toMatch(/503/);
  });
});

describe('fetchCardNames', () => {
  it('GETs /api/cards/names and returns the list', async () => {
    global.fetch.mockResolvedValue(jsonResponse(['Black Lotus', 'Serra Angel']));

    await expect(fetchCardNames(BASE)).resolves.toEqual(['Black Lotus', 'Serra Angel']);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/api/cards/names`, expect.anything());
  });

  it('throws on a non-2xx response', async () => {
    global.fetch.mockResolvedValue(jsonResponse({}, 502));
    await expect(fetchCardNames(BASE)).rejects.toThrow(/502/);
  });
});

describe('fetchSets', () => {
  it('GETs /api/cards/sets and returns the list', async () => {
    const sets = [{ code: 'lea', name: 'Limited Edition Alpha', type: 'core', releasedAt: '1993-08-05', cardCount: 290 }];
    global.fetch.mockResolvedValue(jsonResponse(sets));

    await expect(fetchSets(BASE)).resolves.toEqual(sets);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE}/api/cards/sets`, expect.anything());
  });
});
