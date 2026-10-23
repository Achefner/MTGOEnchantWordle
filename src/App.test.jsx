import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { fetchRandomCard, fetchCardByName, fetchCardNames, fetchSets, CardNotFoundError } from './api/cardsApi';

jest.mock('./api/cardsApi', () => {
  const actual = jest.requireActual('./api/cardsApi');
  return { ...actual, fetchRandomCard: jest.fn(), fetchCardByName: jest.fn(), fetchCardNames: jest.fn(), fetchSets: jest.fn() };
});

const serraAngel = {
  id: 'serra-angel', name: 'Serra Angel', manaCost: '{3}{W}{W}', types: ['CREATURE'],
  power: 4, toughness: 4, surtypes: [], subtypes: ['Angel'], colorIdentity: 'W',
  sets: ['lea', 'm15'], originalPrintedSet: 'lea', originalPrintedSetName: 'Limited Edition Alpha', originalPrintedSetType: 'core', firstPrintedAt: '1993-08-05', rarity: 'UNCOMMON', imgUrl: null,
};
const llanowarElves = {
  id: 'llanowar-elves', name: 'Llanowar Elves', manaCost: '{G}', types: ['CREATURE'],
  power: 1, toughness: 1, surtypes: [], subtypes: ['Elf', 'Druid'], colorIdentity: 'G',
  sets: ['lea', 'm19'], originalPrintedSet: 'lea', originalPrintedSetName: 'Limited Edition Alpha', originalPrintedSetType: 'core', firstPrintedAt: '1993-08-05', rarity: 'COMMON', imgUrl: null,
};

const wrongCard = (i) => ({ ...llanowarElves, id: `wrong-${i}`, name: `Wrong Card ${i}` });

const guess = async (name) => {
  await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), `${name}{enter}`);
};

beforeEach(() => {
  fetchRandomCard.mockReset();
  fetchCardByName.mockReset();
  fetchCardNames.mockReset();
  fetchCardNames.mockResolvedValue(['Llanowar Elves', 'Serra Angel']);
  fetchSets.mockReset();
  fetchSets.mockResolvedValue([
    { code: 'lea', name: 'Limited Edition Alpha', type: 'core', releasedAt: '1993-08-05', cardCount: 290 },
    { code: 'rtr', name: 'Return to Ravnica', type: 'expansion', releasedAt: '2012-10-05', cardCount: 274 },
  ]);
});

describe('App', () => {
  it('fetches a random card on load and shows the loading state meanwhile', async () => {
    let resolve;
    fetchRandomCard.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<App />);

    expect(screen.getByText(/picking a card/i)).toBeInTheDocument();
    expect(fetchRandomCard).toHaveBeenCalledTimes(1);

    resolve(serraAngel);
    expect(await screen.findByRole('textbox', { name: /card name/i })).toBeInTheDocument();
    expect(screen.queryByText(/picking a card/i)).not.toBeInTheDocument();
  });

  it('shows an error with a retry button when the random card cannot be loaded', async () => {
    fetchRandomCard.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(serraAngel);
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load a card/i);
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByRole('textbox', { name: /card name/i })).toBeInTheDocument();
    expect(fetchRandomCard).toHaveBeenCalledTimes(2);
  });

  it('adds a feedback row after a wrong guess', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    fetchCardByName.mockResolvedValue(llanowarElves);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    await guess('Llanowar Elves');

    expect(fetchCardByName).toHaveBeenCalledWith('Llanowar Elves');
    const row = (await screen.findAllByRole('row'))[1];
    expect(within(row).getByText('Llanowar Elves')).toBeInTheDocument();
    expect(within(row).getAllByRole('cell')[2]).toHaveAttribute('data-status', 'none');
    expect(screen.queryByRole('heading', { name: /you found/i })).not.toBeInTheDocument();
  });

  it('shows an error when the guessed card is unknown', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    fetchCardByName.mockRejectedValue(new CardNotFoundError('Nonexistent'));
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    await guess('Nonexistent');

    expect(await screen.findByRole('alert')).toHaveTextContent(/no card named "Nonexistent"/i);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('ignores a card that was already guessed', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    fetchCardByName.mockResolvedValue(llanowarElves);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    await guess('Llanowar Elves');
    await screen.findAllByRole('row');
    await guess('llanowar elves');

    expect(await screen.findByRole('alert')).toHaveTextContent(/already guessed/i);
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(fetchCardByName).toHaveBeenCalledTimes(1);
  });

  it('shows the win panel with the card back placeholder and restarts a new game', async () => {
    const secondCard = { ...llanowarElves };
    fetchRandomCard.mockResolvedValueOnce(serraAngel).mockResolvedValueOnce(secondCard);
    fetchCardByName.mockResolvedValueOnce(llanowarElves).mockResolvedValueOnce(serraAngel);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    await guess('Llanowar Elves');
    await screen.findAllByRole('row');
    await guess('Serra Angel');

    expect(await screen.findByRole('heading', { name: /you found serra angel/i })).toBeInTheDocument();
    expect(screen.getByText(/in 2 guesses/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /serra angel/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /card name/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /play again/i }));

    await waitFor(() => expect(fetchRandomCard).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('textbox', { name: /card name/i })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /you found/i })).not.toBeInTheDocument();
  });

  it('loads the card names once and offers suggestions while typing', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), 'ang');

    expect(await screen.findByRole('option', { name: 'Serra Angel' })).toBeInTheDocument();
    expect(fetchCardNames).toHaveBeenCalledTimes(1);
  });

  it('still lets the player guess when the names list cannot be loaded', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    fetchCardNames.mockRejectedValue(new Error('boom'));
    fetchCardByName.mockResolvedValue(llanowarElves);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    await guess('Llanowar Elves');

    expect(await screen.findAllByRole('row')).toHaveLength(2);
  });

  it('keeps the names list across a restart', async () => {
    fetchRandomCard.mockResolvedValueOnce(serraAngel).mockResolvedValueOnce(llanowarElves);
    fetchCardByName.mockResolvedValueOnce(serraAngel);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });
    await guess('Serra Angel');
    await userEvent.click(await screen.findByRole('button', { name: /play again/i }));
    await screen.findByRole('textbox', { name: /card name/i });

    expect(fetchCardNames).toHaveBeenCalledTimes(1);
  });

  it('shows the set timeline above the game and loads the sets once', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    const timeline = await screen.findByRole('list', { name: /set timeline/i });
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(2);
    expect(fetchSets).toHaveBeenCalledTimes(1);
  });

  it('highlights the matching set in the timeline after a correct guess', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    fetchCardByName.mockResolvedValue(serraAngel);
    render(<App />);
    await screen.findByRole('textbox', { name: /card name/i });

    await guess('Serra Angel');
    await screen.findByRole('heading', { name: /you found/i });

    const items = within(screen.getByRole('list', { name: /set timeline/i })).getAllByRole('listitem');
    expect(items.map((i) => i.dataset.state)).toEqual(['match', 'excluded']);
  });

  it('still works when the sets cannot be loaded', async () => {
    fetchRandomCard.mockResolvedValue(serraAngel);
    fetchSets.mockRejectedValue(new Error('boom'));
    render(<App />);

    expect(await screen.findByRole('textbox', { name: /card name/i })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /set timeline/i })).not.toBeInTheDocument();
  });

  describe('guess counter and limit', () => {
    it('shows the guess counter from the first guess on', async () => {
      fetchRandomCard.mockResolvedValue(serraAngel);
      fetchCardByName.mockResolvedValue(llanowarElves);
      render(<App />);
      await screen.findByRole('textbox', { name: /card name/i });
      expect(screen.getByText('Guess 1 of 20')).toBeInTheDocument();

      await guess('Llanowar Elves');

      expect(await screen.findByText('Guess 2 of 20')).toBeInTheDocument();
    });

    it('ends the game and reveals the card after 20 wrong guesses', async () => {
      fetchRandomCard.mockResolvedValue(serraAngel);
      for (let i = 1; i <= 20; i += 1) fetchCardByName.mockResolvedValueOnce(wrongCard(i));
      render(<App />);
      await screen.findByRole('textbox', { name: /card name/i });

      for (let i = 1; i <= 20; i += 1) {
        await guess(`Wrong Card ${i}`);
        await screen.findByText(`Wrong Card ${i}`);
      }

      expect(await screen.findByRole('heading', { name: /out of guesses.*serra angel/i })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /serra angel/i })).toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: /card name/i })).not.toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(21);
      expect(screen.queryByText(/guess 21 of 20/i)).not.toBeInTheDocument();
    });

    it('lets the player restart after losing', async () => {
      fetchRandomCard.mockResolvedValueOnce(serraAngel).mockResolvedValueOnce(llanowarElves);
      for (let i = 1; i <= 20; i += 1) fetchCardByName.mockResolvedValueOnce(wrongCard(i));
      render(<App />);
      await screen.findByRole('textbox', { name: /card name/i });
      for (let i = 1; i <= 20; i += 1) {
        await guess(`Wrong Card ${i}`);
        await screen.findByText(`Wrong Card ${i}`);
      }
      await screen.findByRole('heading', { name: /out of guesses/i });

      await userEvent.click(screen.getByRole('button', { name: /play again/i }));

      expect(await screen.findByRole('textbox', { name: /card name/i })).toBeInTheDocument();
      expect(screen.getByText('Guess 1 of 20')).toBeInTheDocument();
      expect(fetchRandomCard).toHaveBeenCalledTimes(2);
    });

    it('wins on the twentieth guess', async () => {
      fetchRandomCard.mockResolvedValue(serraAngel);
      for (let i = 1; i <= 19; i += 1) fetchCardByName.mockResolvedValueOnce(wrongCard(i));
      fetchCardByName.mockResolvedValueOnce(serraAngel);
      render(<App />);
      await screen.findByRole('textbox', { name: /card name/i });
      for (let i = 1; i <= 19; i += 1) {
        await guess(`Wrong Card ${i}`);
        await screen.findByText(`Wrong Card ${i}`);
      }

      await guess('Serra Angel');

      expect(await screen.findByRole('heading', { name: /you found serra angel/i })).toBeInTheDocument();
      expect(screen.getByText(/in 20 guesses/i)).toBeInTheDocument();
    });
  });
});
