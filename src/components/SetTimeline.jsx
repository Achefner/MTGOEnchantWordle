import { classifySets } from '../domain/setTimeline';
import { SET_ICON_URL } from './setIcons';

/** Chronological strip of set symbols; sets ruled out by the guesses so far are dimmed. */
export default function SetTimeline({ sets, guesses }) {
  if (!sets || sets.length === 0) return null;
  const states = classifySets(sets, guesses);

  return (
    <ul className="set-timeline" aria-label="Set timeline">
      {sets.map((set) => {
        const label = `${set.code.toUpperCase()} – ${set.name} (${set.releasedAt.slice(0, 4)})`;
        return (
          <li key={set.code} className="set-timeline__item" data-state={states[set.code]} title={label}>
            <img src={SET_ICON_URL(set.code)} alt={label} loading="lazy" />
          </li>
        );
      })}
    </ul>
  );
}
