import { fireEvent, render, screen, within } from '@testing-library/react';

import App from './App';

const SIDEBAR_EXPANDED_STORAGE_KEY = 'app.sidebarExpanded.v1';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders collapsed by default with active nav state and connectors content', async () => {
    render(<App />);

    const sidebar = screen.getByRole('complementary', { name: /sidebar/i });
    const navigation = within(sidebar).getByLabelText(/primary navigation/i);
    const activeNavItem = within(navigation).getByRole('button', { name: /connectors/i });

    expect(sidebar.querySelector('.app-sidebar--collapsed')).toHaveAttribute('data-expanded', 'false');
    expect(activeNavItem).toHaveAttribute('aria-current', 'page');
    expect(within(navigation).getByRole('button', { name: /runs/i })).toBeDisabled();

    expect(screen.getByRole('heading', { level: 2, name: /connectors config/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: /^connectors$/i })).toBeInTheDocument();

    fireEvent.click(within(navigation).getByRole('button', { name: /agents/i }));
    expect(within(navigation).getByRole('button', { name: /agents/i })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByRole('heading', { level: 2, name: /agents config/i })).toBeInTheDocument();
  });

  it('toggles to expanded mode and keeps nav items accessible with tooltips', () => {
    render(<App />);

    const sidebar = screen.getByRole('complementary', { name: /sidebar/i });
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));

    expect(sidebar.querySelector('.app-sidebar--expanded')).toHaveAttribute('data-expanded', 'true');
    expect(within(sidebar).getByText(/dataclaw console/i)).toBeInTheDocument();

    const connectorsButton = within(sidebar).getByRole('button', { name: /connectors/i });
    const domainsButton = within(sidebar).getByRole('button', { name: /agents/i });
    const runsButton = within(sidebar).getByRole('button', { name: /runs/i });

    expect(connectorsButton).toHaveAttribute('title', 'Connectors - Config drafts');
    expect(domainsButton).toHaveAttribute('title', 'Agents - Config drafts');
    expect(runsButton).toHaveAttribute('title', 'Runs - Coming soon');
    expect(runsButton).toBeDisabled();
  });

  it('restores expanded preference from localStorage and persists updates', () => {
    window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, 'true');

    render(<App />);

    const sidebar = screen.getByRole('complementary', { name: /sidebar/i });
    expect(sidebar.querySelector('.app-sidebar--expanded')).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }));

    expect(window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY)).toBe('false');
    expect(sidebar.querySelector('.app-sidebar--collapsed')).toHaveAttribute('data-expanded', 'false');
  });
});
