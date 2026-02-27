import { fireEvent, render, screen } from '@testing-library/react';

import { Input } from './Input';

describe('Input', () => {
  it('renders info tooltip next to label when provided', () => {
    render(<Input label="Database URL" infoTooltip="Connection string help." value="" onChange={() => undefined} />);

    expect(screen.getByRole('button', { name: /about database url/i })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('button', { name: /about database url/i }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Connection string help.');
  });
});
