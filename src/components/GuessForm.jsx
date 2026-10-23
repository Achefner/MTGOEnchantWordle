import { useId, useState } from 'react';
import { searchNames } from '../domain/searchNames';

/** Suggestions only start after this many typed characters, to keep the list manageable. */
export const MIN_QUERY_LENGTH = 3;

export default function GuessForm({ onGuess, names = [], disabled = false }) {
  const [name, setName] = useState('');
  const [highlighted, setHighlighted] = useState(-1);
  const [open, setOpen] = useState(false);
  const listId = useId();

  const suggestions = open && name.trim().length >= MIN_QUERY_LENGTH ? searchNames(names, name) : [];

  const submit = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onGuess(trimmed);
    setName('');
    setHighlighted(-1);
    setOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(highlighted >= 0 && suggestions[highlighted] ? suggestions[highlighted] : name);
  };

  const handleKeyDown = (event) => {
    if (suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <div className="guess-form__field">
        <label htmlFor="guess-input" className="visually-hidden">Card name</label>
        <input
          id="guess-input"
          type="text"
          autoComplete="off"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
          placeholder="Type a card name…"
          value={name}
          disabled={disabled}
          onChange={(event) => {
            setName(event.target.value);
            setHighlighted(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(true)}
        />
        {suggestions.length > 0 && (
          <ul id={listId} role="listbox" className="suggestions">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === highlighted}
                className={index === highlighted ? 'suggestions__item suggestions__item--active' : 'suggestions__item'}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submit(suggestion)}
                onMouseEnter={() => setHighlighted(index)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={disabled}>Guess</button>
    </form>
  );
}
