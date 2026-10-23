import { render, screen } from '@testing-library/react';
import SetTimeline from './SetTimeline';
import { EXACT, NONE, LOWER } from '../domain/compareCards';
import { SET_ICON_URL } from './setIcons';

const sets = [
  { code: 'lea', name: 'Limited Edition Alpha', type: 'core', releasedAt: '1993-08-05', cardCount: 290 },
  { code: 'rtr', name: 'Return to Ravnica', type: 'expansion', releasedAt: '2012-10-05', cardCount: 274 },
  { code: 'mom', name: 'March of the Machine', type: 'expansion', releasedAt: '2023-04-21', cardCount: 281 },
];

describe('SetTimeline', () => {
  it('renders nothing when there are no sets', () => {
    render(<SetTimeline sets={[]} guesses={[]} />);
    expect(screen.queryByRole('list', { name: /set timeline/i })).not.toBeInTheDocument();
  });

  it('renders one icon per set in order, with code, name and year', () => {
    render(<SetTimeline sets={sets} guesses={[]} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    const icons = screen.getAllByRole('img');
    expect(icons.map((i) => i.getAttribute('alt'))).toEqual([
      'LEA – Limited Edition Alpha (1993)', 'RTR – Return to Ravnica (2012)', 'MOM – March of the Machine (2023)',
    ]);
    expect(icons[1]).toHaveAttribute('src', SET_ICON_URL('rtr'));
    expect(items.map((i) => i.dataset.state)).toEqual(['possible', 'possible', 'possible']);
  });

  it('dims ruled-out sets and highlights the matched one', () => {
    const guesses = [
      { originalPrintedSet: { code: 'lea', date: '1993-08-05', status: NONE, direction: LOWER } },
      { originalPrintedSet: { code: 'rtr', date: '2012-10-05', status: EXACT, direction: null } },
    ];
    render(<SetTimeline sets={sets} guesses={guesses} />);
    expect(screen.getAllByRole('listitem').map((i) => i.dataset.state)).toEqual(['excluded', 'match', 'excluded']);
  });
});
