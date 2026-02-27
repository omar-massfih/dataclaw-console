import { render, screen, within } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders nav states and connectors page content inside app shell', async () => {
    render(<App />);

    const sidebar = screen.getByLabelText(/sidebar/i);
    expect(sidebar).toBeInTheDocument();

    const navigation = screen.getByLabelText(/primary navigation/i);
    expect(navigation).toBeInTheDocument();

    const activeNavItem = within(navigation).getByRole('button', { name: /connectors/i });
    expect(activeNavItem).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('button', { name: /runs/i })).toBeDisabled();

    expect(screen.getByRole('heading', { level: 2, name: /connectors config \(v1\)/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: /^connectors$/i })).toBeInTheDocument();
  });
});
