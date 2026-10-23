import { useEffect, useState } from 'react';
import './App.css';
import { fetchCardByName, fetchCardNames, fetchRandomCard, fetchSets, CardNotFoundError } from './api/cardsApi';
import { compareCards } from './domain/compareCards';
import { selectTimelineSets } from './domain/setTimeline';
import GuessForm from './components/GuessForm';
import GuessTable from './components/GuessTable';
import WinPanel from './components/WinPanel';
import SetTimeline from './components/SetTimeline';

const LOADING = 'loading';
const LOAD_ERROR = 'load-error';
const PLAYING = 'playing';
const WON = 'won';
const LOST = 'lost';

export const MAX_GUESSES = 20;

export default function App() {
  const [status, setStatus] = useState(LOADING);
  const [target, setTarget] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [message, setMessage] = useState(null);
  const [checking, setChecking] = useState(false);

  const [round, setRound] = useState(0);
  const [names, setNames] = useState([]);
  const [sets, setSets] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchSets()
      .then((list) => {
        if (!cancelled) setSets(selectTimelineSets(list));
      })
      .catch(() => {
        // The timeline is a convenience: the set hint in the table still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCardNames()
      .then((list) => {
        if (!cancelled) setNames(list);
      })
      .catch(() => {
        // Suggestions are a convenience: without the list the player can still type full names.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchRandomCard()
      .then((card) => {
        if (cancelled) return;
        setTarget(card);
        setStatus(PLAYING);
      })
      .catch(() => {
        if (!cancelled) setStatus(LOAD_ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, [round]);

  const startGame = () => {
    setStatus(LOADING);
    setTarget(null);
    setGuesses([]);
    setMessage(null);
    setRound((previous) => previous + 1);
  };

  const handleGuess = async (name) => {
    setMessage(null);
    if (guesses.some((feedback) => feedback.name.toLowerCase() === name.toLowerCase())) {
      setMessage(`You already guessed ${name}.`);
      return;
    }
    setChecking(true);
    try {
      const card = await fetchCardByName(name);
      const feedback = compareCards(card, target);
      const guessCount = guesses.length + 1;
      setGuesses((previous) => [...previous, feedback]);
      if (feedback.correct) setStatus(WON);
      else if (guessCount >= MAX_GUESSES) setStatus(LOST);
    } catch (error) {
      setMessage(error instanceof CardNotFoundError
        ? `No card named "${name}" was found. Check the spelling and try again.`
        : 'Could not check that card. Is the card database running?');
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="app">
      <header className="app__header">
        <h1>MTGO Enchant Wordle</h1>
        <p className="app__tagline">Guess the hidden Magic card. Each guess reveals hints about the target.</p>
      </header>

      {(status === PLAYING || status === WON || status === LOST) && <SetTimeline sets={sets} guesses={guesses} />}

      {status === LOADING && <p className="app__status">Picking a card…</p>}

      {status === LOAD_ERROR && (
        <div role="alert" className="app__alert">
          <p>Could not load a card from the database.</p>
          <button type="button" onClick={startGame}>Retry</button>
        </div>
      )}

      {status === PLAYING && (
        <>
          <p className="guess-counter">Guess {guesses.length + 1} of {MAX_GUESSES}</p>
          <GuessForm onGuess={handleGuess} names={names} disabled={checking} />
        </>
      )}

      {message && status !== LOAD_ERROR && <p role="alert" className="app__alert">{message}</p>}

      {(status === WON || status === LOST) && (
        <WinPanel card={target} guessCount={guesses.length} lost={status === LOST} onRestart={startGame} />
      )}

      {(status === PLAYING || status === WON || status === LOST) && (
        <>
          <GuessTable guesses={guesses} />
          <Legend />
        </>
      )}
    </main>
  );
}

function Legend() {
  return (
    <ul className="legend" aria-label="Legend">
      <li><span className="legend__swatch hint--exact" /> exact match</li>
      <li><span className="legend__swatch legend__swatch--partial" /> partial match (bar = share of the guessed colours / words found in the target; mana value within 2; set = same year)</li>
      <li><span className="legend__swatch legend__swatch--none" /> no match</li>
      <li><span className="legend__swatch hint--higher" />↑ / ↓ target is higher, rarer or printed later / lower, more common or printed earlier</li>
      <li><span className="legend__swatch legend__swatch--timeline" /> set timeline: dimmed sets are ruled out, gold is the target's first set</li>
    </ul>
  );
}
