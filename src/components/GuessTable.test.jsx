import { render, screen, within } from '@testing-library/react';
import GuessTable from './GuessTable';
import { EXACT, PARTIAL, NONE, HIGHER, LOWER } from '../domain/compareCards';
import { SET_ICON_URL } from './setIcons';

const feedback = {
  correct: false,
  name: 'Omnath, Locus of All',
  manaValue: { value: 5, status: NONE, direction: HIGHER },
  colorIdentity: { value: ['W', 'U', 'B', 'R', 'G'], matched: 1, total: 5, status: PARTIAL },
  rarity: { value: 'Mythic', status: HIGHER },
  typeLine: { value: 'Legendary Creature', matched: 1, total: 2, status: PARTIAL },
  subtypes: { value: 'Phyrexian Elemental', matched: 0, total: 2, status: NONE },
  originalPrintedSet: { value: 'MOM', code: 'mom', name: 'March of the Machine', year: '23', date: '2023-04-21', status: NONE, direction: HIGHER },
};

const cellsOf = (row) => within(row).getAllByRole('cell');

describe('GuessTable', () => {
  it('renders nothing but a hint when there are no guesses', () => {
    render(<GuessTable guesses={[]} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/no guesses yet/i)).toBeInTheDocument();
  });

  it('renders the column headers', () => {
    render(<GuessTable guesses={[feedback]} />);
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Name', 'Mana value', 'Colours', 'Rarity', 'Type / Supertype', 'Subtype', 'Set']);
  });

  it('renders one row per guess, most recent first', () => {
    const older = { ...feedback, name: 'Black Lotus' };
    render(<GuessTable guesses={[older, feedback]} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Omnath, Locus of All')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Black Lotus')).toBeInTheDocument();
  });

  it('tags each cell with its feedback status', () => {
    render(<GuessTable guesses={[feedback]} />);
    const cells = cellsOf(screen.getAllByRole('row')[1]);
    expect(cells.map((c) => c.dataset.status)).toEqual([undefined, NONE, PARTIAL, HIGHER, PARTIAL, NONE, NONE]);
  });

  it('marks cells without a bar as solid so partial status is painted yellow', () => {
    render(<GuessTable guesses={[feedback]} />);
    const cells = cellsOf(screen.getAllByRole('row')[1]);
    expect(cells[1]).toHaveClass('hint--solid');
    expect(cells[3]).toHaveClass('hint--solid');
    expect(cells[6]).toHaveClass('hint--solid');
    expect(cells[2]).not.toHaveClass('hint--solid');
    expect(cells[4]).not.toHaveClass('hint--solid');
    expect(cells[5]).not.toHaveClass('hint--solid');
  });

  it('shows the guessed colours as dots in WUBRG order', () => {
    render(<GuessTable guesses={[feedback]} />);
    const colours = cellsOf(screen.getAllByRole('row')[1])[2];
    expect(within(colours).getAllByRole('img').map((d) => d.getAttribute('aria-label'))).toEqual(['White', 'Blue', 'Black', 'Red', 'Green']);
  });

  it('keeps the colour bar inside the same box as the dots, so it spans exactly the dots', () => {
    render(<GuessTable guesses={[feedback]} />);
    const colours = cellsOf(screen.getAllByRole('row')[1])[2];
    const bar = within(colours).getByRole('progressbar');
    const box = bar.parentElement;
    expect(box).toHaveClass('color-group');
    expect(within(box).getAllByRole('img')).toHaveLength(5);
  });

  it('shows a colorless guess as a single dot', () => {
    const colorless = { ...feedback, colorIdentity: { value: [], matched: 0, total: 0, status: NONE } };
    render(<GuessTable guesses={[colorless]} />);
    const colours = cellsOf(screen.getAllByRole('row')[1])[2];
    expect(within(colours).getAllByRole('img').map((d) => d.getAttribute('aria-label'))).toEqual(['Colorless']);
  });

  it('shows a bar filled proportionally to the matched share for colours, types and subtypes', () => {
    render(<GuessTable guesses={[feedback]} />);
    const cells = cellsOf(screen.getAllByRole('row')[1]);
    expect(within(cells[2]).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    expect(within(cells[2]).getByRole('progressbar')).toHaveAccessibleName('Colours: 1 of 5 match');
    expect(within(cells[4]).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(within(cells[5]).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(within(cells[5]).getByRole('progressbar')).toHaveAccessibleName('Subtype: 0 of 2 match');
    expect(within(cells[1]).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows a full bar for an exact match with nothing to compare', () => {
    const exact = { ...feedback, subtypes: { value: '—', matched: 0, total: 0, status: EXACT } };
    render(<GuessTable guesses={[exact]} />);
    const cells = cellsOf(screen.getAllByRole('row')[1]);
    expect(within(cells[5]).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows arrows and wording for ordered hints', () => {
    render(<GuessTable guesses={[feedback]} />);
    const row = screen.getAllByRole('row')[1];
    expect(within(row).getByLabelText(/mana value 5, target is lower/i)).toBeInTheDocument();
    expect(within(row).getByLabelText(/rarity mythic, target is more common/i)).toBeInTheDocument();
    expect(within(row).getByLabelText(/set mom \(march of the machine, 2023\), target was printed earlier/i)).toBeInTheDocument();
    expect(within(row).getAllByText('↓')).toHaveLength(3);
  });

  it('shows the set symbol and two-digit year in the set cell', () => {
    render(<GuessTable guesses={[feedback]} />);
    const set = cellsOf(screen.getAllByRole('row')[1])[6];
    expect(within(set).getByRole('img', { name: /march of the machine/i })).toHaveAttribute('src', SET_ICON_URL('mom'));
    expect(within(set).getByText("'23")).toBeInTheDocument();
  });

  it('colours the mana value cell as partial when close to the target, keeping the arrow', () => {
    const close = { ...feedback, manaValue: { value: 3, status: PARTIAL, direction: LOWER } };
    render(<GuessTable guesses={[close]} />);
    const row = screen.getAllByRole('row')[1];
    expect(cellsOf(row)[1]).toHaveAttribute('data-status', PARTIAL);
    expect(within(row).getByLabelText(/mana value 3, close, target is higher/i)).toBeInTheDocument();
    expect(within(row).getAllByText('↑')).toHaveLength(1);
  });

  it('colours the set cell as partial when the target came out the same year, keeping the arrow', () => {
    const sameYear = { ...feedback, originalPrintedSet: { ...feedback.originalPrintedSet, status: PARTIAL, direction: LOWER } };
    render(<GuessTable guesses={[sameYear]} />);
    const row = screen.getAllByRole('row')[1];
    expect(cellsOf(row)[6]).toHaveAttribute('data-status', PARTIAL);
    expect(within(row).getByLabelText(/set mom .*same year, target was printed later/i)).toBeInTheDocument();
    expect(within(row).getAllByText('↑')).toHaveLength(1);
  });

  it('shows a later-printed hint with an up arrow', () => {
    const older = { ...feedback, originalPrintedSet: { ...feedback.originalPrintedSet, status: NONE, direction: LOWER } };
    render(<GuessTable guesses={[older]} />);
    const row = screen.getAllByRole('row')[1];
    expect(within(row).getByLabelText(/set mom .*target was printed later/i)).toBeInTheDocument();
    expect(within(row).getAllByText('↑')).toHaveLength(1);
  });

  it('shows a dash when the guess has no set', () => {
    const noSet = { ...feedback, originalPrintedSet: { value: '—', code: null, name: null, year: null, date: null, status: NONE, direction: null } };
    render(<GuessTable guesses={[noSet]} />);
    const set = cellsOf(screen.getAllByRole('row')[1])[6];
    expect(within(set).queryByRole('img')).not.toBeInTheDocument();
    expect(within(set).getByText('—')).toBeInTheDocument();
  });
});
