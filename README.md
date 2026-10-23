# MTGO Enchant Wordle

A Wordle-style Magic: The Gathering card guessing game, in the spirit of
[enchantworldle.com](https://enchantworldle.com). On page load the app asks its backend,
**MTGOEnchantWordleService** (a thin bridge to **MTGODatabase**), for a random card and for
the list of every card name. You have **20 guesses**. Type at least three characters to get
a scrollable list of every card whose name has a word starting with what you typed ("titan"
suggests "Grave Titan", "itan" suggests nothing); after each guess a row of hints tells you
how close you are. When you find the card, or run out of guesses, its image (or a placeholder
card back when the database has no image for it) is shown and you can start a new round.

## Hint categories

Colours are the card's **colour identity** (so Kenrith, the Returned King is all five colours).

| Column           | Source field                            | Feedback                                                                 |
|------------------|-----------------------------------------|--------------------------------------------------------------------------|
| Mana value       | derived from `manaCost`                 | green = exact, yellow = within 2 of the target, grey otherwise; ↑ / ↓ target is higher / lower |
| Colours          | `colorIdentity`, shown as WUBRG dots    | bar = share of the guessed colours that are in the target; green = exact |
| Rarity           | `rarity`                                | exact, ↑ target is rarer / ↓ more common; none when unranked             |
| Type / Supertype | `surtypes` + `types` ("Legendary Creature") | bar = share of the guessed words found in the target; green = exact   |
| Subtype          | `subtypes`                              | same bar                                                                 |
| Set              | `originalPrintedSet` symbol + year      | green = same set, yellow = target's first set came out the same year; ↑ / ↓ target first printed later / earlier |

The bar is empty when nothing matches, proportionally filled otherwise: against a black
target, Omnath, Locus of Creation (4 colours, no black) shows an empty bar and Omnath,
Locus of All (5 colours) shows a 20% bar.

Above the game a **set timeline** shows the symbols of every regular set (core, expansion,
commander, draft innovation, masters, starter sets with at least 10 first printings) in
chronological order. Sets ruled out by the before / after and same-year hints are dimmed and
the target's set is highlighted once found. Set symbols are loaded from `svgs.scryfall.io`.

## Running locally

1. Start the card database (from `../MTGODatabase`), then populate it once:
   ```bash
   mvn quarkus:dev                                   # http://localhost:8080
   curl -X POST http://localhost:8080/admin/scryfall/import   # downloads Scryfall bulk data
   ```
   The `dev` profile uses an in-memory H2 database, so the import must be rerun after
   each restart. Use the `local` profile (postgres via docker-compose) to keep the data.
2. Start the backend bridge (from `../MTGOEnchantWordleService`):
   ```bash
   mvn quarkus:dev                                   # http://localhost:8081
   ```
3. Start the front end:
   ```bash
   npm install --legacy-peer-deps
   npm run dev                                       # http://localhost:5173
   ```

The backend URL defaults to `http://localhost:8081`; override it with
`VITE_API_BASE_URL=http://host:port npm run dev` (or at build time).

## Scripts

```bash
npm test                # Jest + Testing Library
npm run test:watch
npm run test:coverage
npm run lint            # oxlint
npm run build           # production bundle in dist/
```

## Layout

```
src/
├── api/cardsApi.js         # fetchRandomCard / fetchCardByName / fetchCardNames against the bridge
├── domain/manaValue.js     # mana value from a "{3}{G}" mana cost
├── domain/compareCards.js  # guess-vs-target hint computation (pure)
├── domain/searchNames.js   # word-prefix name search for the suggestions
├── domain/setTimeline.js   # which sets appear on the timeline, and which are ruled out
├── components/SetTimeline  # the strip of set symbols above the game
├── components/GuessForm    # card-name input with suggestions (click or arrows + Enter)
├── components/GuessTable   # one hint row per guess, most recent first
├── components/WinPanel     # found card image (or card back) + "Play again"
└── App.jsx                 # game state machine: loading → playing → won
```
