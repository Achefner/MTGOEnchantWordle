/** Scryfall hosts an SVG symbol for every regular set, addressed by set code. */
export const SET_ICON_URL = (code) => `https://svgs.scryfall.io/sets/${encodeURIComponent(code.toLowerCase())}.svg`;
