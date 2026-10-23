import { API_BASE_URL } from '../config';

export class CardNotFoundError extends Error {
  constructor(name) {
    super(`Card not found: ${name}`);
    this.name = 'CardNotFoundError';
    this.cardName = name;
  }
}

const REQUEST_OPTIONS = { headers: { Accept: 'application/json' } };

async function getJson(url) {
  const response = await fetch(url, REQUEST_OPTIONS);
  if (!response.ok) {
    const error = new Error(`Request to ${url} failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/** Fetches a random card from `GET /api/cards/random`. */
export function fetchRandomCard(baseUrl = API_BASE_URL) {
  return getJson(`${baseUrl}/api/cards/random`);
}

/** Fetches a card by exact (case-insensitive) name from `GET /api/cards/{name}`. */
export async function fetchCardByName(name, baseUrl = API_BASE_URL) {
  try {
    return await getJson(`${baseUrl}/api/cards/${encodeURIComponent(name)}`);
  } catch (error) {
    if (error.status === 404) throw new CardNotFoundError(name);
    throw error;
  }
}

/** Fetches every card name (sorted) from `GET /api/cards/names`, for the name search. */
export function fetchCardNames(baseUrl = API_BASE_URL) {
  return getJson(`${baseUrl}/api/cards/names`);
}

/** Fetches the sets in which cards were first printed from `GET /api/cards/sets`, for the timeline. */
export function fetchSets(baseUrl = API_BASE_URL) {
  return getJson(`${baseUrl}/api/cards/sets`);
}
