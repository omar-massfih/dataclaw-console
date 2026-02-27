import { fireEvent, render, screen } from '@testing-library/react';

import { InfoTooltip } from './InfoTooltip';

describe('InfoTooltip', () => {
  it('shows on hover and hides on mouse leave', () => {
    render(<InfoTooltip label="About Basics section" content="Basics help text" />);

    const trigger = screen.getByRole('button', { name: /about basics section/i });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Basics help text');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('supports focus and click toggle, then closes on escape', () => {
    render(<InfoTooltip label="About Routing section" content="Routing help text" />);

    const trigger = screen.getByRole('button', { name: /about routing section/i });
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Routing help text');

    fireEvent.click(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on outside click when pinned open', () => {
    render(
      <div>
        <InfoTooltip label="About Tools section" content="Tools help text" />
        <button type="button">Outside</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /about tools section/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
