import { EXACT, PARTIAL, HIGHER, LOWER } from '../domain/compareCards';
import { SET_ICON_URL } from './setIcons';

const COLOR_NAMES = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colorless' };

// Ordered hint statuses describe the guess relative to the target, so a LOWER guess
// means the target is "up" (shown ↑) and a HIGHER guess means the target is "down" (↓).
function arrowFor(status) {
  if (status === LOWER) return '↑';
  if (status === HIGHER) return '↓';
  return null;
}

// "solid" cells (no bar) are painted with their status colour; bar cells stay neutral
// and let the bar show the matched share.
function Cell({ status, label, solid = false, children }) {
  const className = `hint hint--${status}${solid ? ' hint--solid' : ''}`;
  return (
    <td data-status={status} className={className} aria-label={label}>
      {children}
    </td>
  );
}

function Arrow({ status }) {
  const arrow = arrowFor(status);
  return arrow ? <span className="hint__arrow" aria-hidden="true">{arrow}</span> : null;
}

function MatchBar({ label, hint }) {
  const percent = hint.total === 0 ? (hint.status === EXACT ? 100 : 0) : Math.round((hint.matched / hint.total) * 100);
  return (
    <div
      className="bar"
      role="progressbar"
      aria-label={`${label}: ${hint.matched} of ${hint.total} match`}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={percent}
    >
      <div className="bar__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

function ManaValueCell({ hint }) {
  const direction = hint.direction === LOWER ? 'target is higher' : 'target is lower';
  const close = hint.status === PARTIAL ? 'close, ' : '';
  const label = arrowFor(hint.direction) ? `Mana value ${hint.value}, ${close}${direction}` : undefined;
  return (
    <Cell status={hint.status} label={label} solid>
      <span className="mana-value">{hint.value}</span>
      <Arrow status={hint.direction} />
    </Cell>
  );
}

function ColorsCell({ hint }) {
  const colors = hint.value.length ? hint.value : ['C'];
  return (
    <Cell status={hint.status}>
      <div className="color-group">
        <div className="color-dots">
          {colors.map((color) => (
            <span key={color} role="img" aria-label={COLOR_NAMES[color]} className={`color-dot color-dot--${color}`} />
          ))}
        </div>
        <MatchBar label="Colours" hint={hint} />
      </div>
    </Cell>
  );
}

function RarityCell({ hint }) {
  const direction = hint.status === LOWER ? 'target is rarer' : 'target is more common';
  const label = arrowFor(hint.status) ? `Rarity ${hint.value}, ${direction}` : undefined;
  return (
    <Cell status={hint.status} label={label} solid>
      <span className={`rarity rarity--${hint.value.toLowerCase()}`}>{hint.value}</span>
      <Arrow status={hint.status} />
    </Cell>
  );
}

function WordsCell({ label, hint }) {
  return (
    <Cell status={hint.status}>
      <span className="hint__value">{hint.value}</span>
      <MatchBar label={label} hint={hint} />
    </Cell>
  );
}

function SetCell({ hint }) {
  const direction = hint.direction === LOWER ? 'target was printed later' : 'target was printed earlier';
  const described = hint.code ? `Set ${hint.value} (${hint.name ?? hint.value}, ${hint.date.slice(0, 4)})` : 'Set unknown';
  const sameYear = hint.status === PARTIAL ? 'same year, ' : '';
  const label = arrowFor(hint.direction) ? `${described}, ${sameYear}${direction}` : undefined;
  return (
    <Cell status={hint.status} label={label} solid>
      {hint.code ? (
        <>
          <img className="set-icon" src={SET_ICON_URL(hint.code)} alt={`${hint.value} – ${hint.name ?? hint.value}`} />
          <span className="set-year">'{hint.year}</span>
        </>
      ) : (
        <span className="hint__value">{hint.value}</span>
      )}
      <Arrow status={hint.direction} />
    </Cell>
  );
}

export default function GuessTable({ guesses }) {
  if (guesses.length === 0) {
    return <p className="guess-table__empty">No guesses yet. Name a card to get your first hints.</p>;
  }

  const rows = [...guesses].reverse();

  return (
    <div className="guess-table__wrapper">
      <table className="guess-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Mana value</th>
            <th scope="col">Colours</th>
            <th scope="col">Rarity</th>
            <th scope="col">Type / Supertype</th>
            <th scope="col">Subtype</th>
            <th scope="col">Set</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((feedback) => (
            <tr key={feedback.name} className={feedback.correct ? 'guess-table__row--correct' : undefined}>
              <td className="guess-table__name">{feedback.name}</td>
              <ManaValueCell hint={feedback.manaValue} />
              <ColorsCell hint={feedback.colorIdentity} />
              <RarityCell hint={feedback.rarity} />
              <WordsCell label="Type / Supertype" hint={feedback.typeLine} />
              <WordsCell label="Subtype" hint={feedback.subtypes} />
              <SetCell hint={feedback.originalPrintedSet} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
