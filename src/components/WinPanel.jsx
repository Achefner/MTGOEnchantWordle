export const CARD_BACK_PLACEHOLDER = '/card-back.svg';

/** End-of-game panel: reveals the card after a win or once the guesses are used up. */
export default function WinPanel({ card, guessCount, lost = false, onRestart }) {
  const guessWord = guessCount === 1 ? 'guess' : 'guesses';
  return (
    <section className={lost ? 'win-panel win-panel--lost' : 'win-panel'} aria-live="polite">
      {lost ? <h2>Out of guesses! The card was {card.name}.</h2> : <h2>You found {card.name}!</h2>}
      {!lost && <p>Solved in {guessCount} {guessWord}.</p>}
      <img
        className="win-panel__card"
        src={card.imgUrl || CARD_BACK_PLACEHOLDER}
        alt={card.imgUrl ? card.name : `${card.name} (image not available, showing card back)`}
      />
      <button type="button" onClick={onRestart}>Play again</button>
    </section>
  );
}
