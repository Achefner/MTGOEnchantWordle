import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuessForm from './GuessForm';

describe('GuessForm', () => {
  it('submits the trimmed card name and clears the input', async () => {
    const onGuess = jest.fn();
    render(<GuessForm onGuess={onGuess} />);

    const input = screen.getByRole('textbox', { name: /card name/i });
    await userEvent.type(input, '  Serra Angel  ');
    await userEvent.click(screen.getByRole('button', { name: /guess/i }));

    expect(onGuess).toHaveBeenCalledWith('Serra Angel');
    expect(input).toHaveValue('');
  });

  it('submits on Enter', async () => {
    const onGuess = jest.fn();
    render(<GuessForm onGuess={onGuess} />);

    await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), 'Counterspell{enter}');

    expect(onGuess).toHaveBeenCalledWith('Counterspell');
  });

  it('does not submit an empty name', async () => {
    const onGuess = jest.fn();
    render(<GuessForm onGuess={onGuess} />);

    await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), '   {enter}');

    expect(onGuess).not.toHaveBeenCalled();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<GuessForm onGuess={jest.fn()} disabled />);

    expect(screen.getByRole('textbox', { name: /card name/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /guess/i })).toBeDisabled();
  });

  describe('suggestions', () => {
    const names = ['Grave Titan', 'Sun Titan', 'Titanic Growth', 'Lightning Bolt'];

    it('shows no suggestions before typing', () => {
      render(<GuessForm onGuess={jest.fn()} names={names} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('lists word-prefix matches while typing', async () => {
      render(<GuessForm onGuess={jest.fn()} names={names} />);
      await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), 'titan');

      const options = screen.getAllByRole('option').map((o) => o.textContent);
      expect(options).toEqual(['Titanic Growth', 'Grave Titan', 'Sun Titan']);
    });

    it('submits a suggestion when clicked and clears the input', async () => {
      const onGuess = jest.fn();
      render(<GuessForm onGuess={onGuess} names={names} />);
      const input = screen.getByRole('textbox', { name: /card name/i });
      await userEvent.type(input, 'titan');
      await userEvent.click(screen.getByRole('option', { name: 'Grave Titan' }));

      expect(onGuess).toHaveBeenCalledWith('Grave Titan');
      expect(input).toHaveValue('');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects with arrow keys and Enter', async () => {
      const onGuess = jest.fn();
      render(<GuessForm onGuess={onGuess} names={names} />);
      await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), 'titan{arrowdown}{arrowdown}{enter}');

      expect(onGuess).toHaveBeenCalledWith('Grave Titan');
    });

    it('submits the typed text when nothing is highlighted', async () => {
      const onGuess = jest.fn();
      render(<GuessForm onGuess={onGuess} names={names} />);
      await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), 'titan{enter}');

      expect(onGuess).toHaveBeenCalledWith('titan');
    });

    it('works without a names list', async () => {
      const onGuess = jest.fn();
      render(<GuessForm onGuess={onGuess} />);
      await userEvent.type(screen.getByRole('textbox', { name: /card name/i }), 'titan{enter}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onGuess).toHaveBeenCalledWith('titan');
    });
  });
});
