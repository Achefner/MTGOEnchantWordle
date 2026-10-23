import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WinPanel, { CARD_BACK_PLACEHOLDER } from './WinPanel';

const card = { name: 'Serra Angel', imgUrl: null };

describe('WinPanel', () => {
  it('announces the found card and the number of guesses', () => {
    render(<WinPanel card={card} guessCount={3} onRestart={jest.fn()} />);
    expect(screen.getByRole('heading', { name: /you found serra angel/i })).toBeInTheDocument();
    expect(screen.getByText(/in 3 guesses/i)).toBeInTheDocument();
  });

  it('uses the singular when found in one guess', () => {
    render(<WinPanel card={card} guessCount={1} onRestart={jest.fn()} />);
    expect(screen.getByText(/in 1 guess\b/i)).toBeInTheDocument();
  });

  it('shows the placeholder card back when the card has no image', () => {
    render(<WinPanel card={card} guessCount={1} onRestart={jest.fn()} />);
    const img = screen.getByRole('img', { name: /serra angel/i });
    expect(img).toHaveAttribute('src', CARD_BACK_PLACEHOLDER);
  });

  it('shows the card image when available', () => {
    render(<WinPanel card={{ ...card, imgUrl: 'https://img.test/serra.jpg' }} guessCount={1} onRestart={jest.fn()} />);
    expect(screen.getByRole('img', { name: /serra angel/i })).toHaveAttribute('src', 'https://img.test/serra.jpg');
  });

  it('calls onRestart when clicking play again', async () => {
    const onRestart = jest.fn();
    render(<WinPanel card={card} guessCount={1} onRestart={onRestart} />);
    await userEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('announces a loss and reveals the card when the player ran out of guesses', async () => {
    const onRestart = jest.fn();
    render(<WinPanel card={card} guessCount={20} lost onRestart={onRestart} />);
    expect(screen.getByRole('heading', { name: /out of guesses! the card was serra angel/i })).toBeInTheDocument();
    expect(screen.queryByText(/solved in/i)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /serra angel/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
