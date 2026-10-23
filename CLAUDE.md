# CLAUDE.md

Front-end microservice: Wordle-style MTG card guessing game. Talks only to its backend
`../MTGOEnchantWordleService` (Quarkus, :8081: `GET /api/cards/random`, `/api/cards/{name}`,
`/api/cards/names`), which bridges to `../MTGODatabase` (:8080). Never call the database directly.

## Commands

```bash
npm install --legacy-peer-deps   # plain `npm install` crashes in npm 10.8 (arborist peer-set bug with vite 8)
npm run dev                      # vite on http://localhost:5173
npm test                         # jest (jsdom + Testing Library), tests live next to the code as *.test.js(x)
npm run lint                     # oxlint
npm run build
```

Single test file: `npx jest src/domain/compareCards.test.js`.

## Conventions

- TDD: write the failing test first, then the implementation. Pure game logic lives in
  `src/domain/` and is tested without React; components are tested through
  Testing Library roles/labels, never implementation details.
- `src/api/cardsApi.js` is the only module that talks to the network. In `App.test.jsx`
  it is mocked with `jest.mock('./api/cardsApi')`.
- API base URL comes from `src/config.js`, injected via the `__API_BASE_URL__` Vite
  define (`VITE_API_BASE_URL` env var). Jest has no define, so it falls back to
  `http://localhost:8081`.
- Jest uses Babel (`babel.config.cjs`), not Vite, so `import.meta.env` must not be used
  in source files.
- Hint statuses are the exported constants `EXACT / PARTIAL / NONE / HIGHER / LOWER`
  from `compareCards.js`; the table renders them as `data-status` attributes and
  `hint--<status>` CSS classes. Ordered statuses describe the *guess* relative to the
  target: `LOWER` = guess is cheaper / more common / printed earlier, rendered as ↑
  ("target is higher / rarer / later"). Keep that convention for any new ordered hint.
  Mana value and set hints are the exception: their `status` is the colour (EXACT; PARTIAL =
  within `CLOSE_MANA_VALUE` (2) of the target / same year; NONE) and the arrow comes from a
  separate `direction` (LOWER / HIGHER / null).
- Hints are mana value, colours (colour identity, WUBRG dots), rarity, type / supertype
  (one merged line), subtype and set. Power and toughness were removed on purpose
  (2026-10-23); don't add them back. Set-style hints carry `matched` / `total` and render a
  proportional bar (`MatchBar`, `role="progressbar"`): share of the *guessed* items found in
  the target, so a guess that is a strict subset of the target still shows a full-ish bar
  with PARTIAL status. Words are de-duplicated for display and counting. The colour bar sits
  in the same inline box as the dots (`.color-group`) so it is exactly as wide as the dots.
- Set symbols are hotlinked from `https://svgs.scryfall.io/sets/{code}.svg`
  (`components/setIcons.js`); promo set codes 404 there, which is one reason the database
  prefers non-promo printings as "first set".
- `domain/setTimeline.js` decides which sets appear in the strip (`TIMELINE_SET_TYPES`,
  `MIN_FIRST_PRINTINGS`) and `classifySets` rules sets out from the set hints; keep that
  logic there, not in the component.
- `searchNames.js` is word-prefix matching (every query word must start some word of the
  name), not substring, and returns every match; `GuessForm` only asks for suggestions from
  `MIN_QUERY_LENGTH` (3) characters and the list scrolls. The full names list (~35k, ~800 KB)
  is fetched once per page load.
- The game is limited to `MAX_GUESSES` (20, exported from `App.jsx`); the counter reads
  "Guess N of 20". Win and loss both reuse `WinPanel` (`lost` prop reveals the card).
- The found card falls back to `public/card-back.svg` when `imgUrl` is null
  (MTGODatabase does not store images yet).
