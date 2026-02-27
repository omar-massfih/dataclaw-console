import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';

import App from './App';

const SIDEBAR_EXPANDED_STORAGE_KEY = 'app.sidebarExpanded.v1';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    fireEvent.click(within(navigation).getByRole('button', { name: /^chat$/i }));
    expect(within(navigation).getByRole('button', { name: /^chat$/i })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByRole('heading', { level: 2, name: /^chat$/i })).toBeInTheDocument();
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

    expect(connectorsButton).toHaveAttribute('title', 'Connectors - Configure Connectors');
    expect(domainsButton).toHaveAttribute('title', 'Agents - Configure Agents');
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

  it('keeps chat conversation in memory when switching pages', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/v1/chat/completions')) {
        return Promise.resolve(
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"pong"}}]}\n\n'));
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
              },
            }),
            { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
          ),
        );
      }
      if (url.includes('/api/config/connectors')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              connectors: [],
              runtime: {
                source_of_truth: 'sqlite',
                generation: 1,
                active_connector_ids: [],
                reload_in_progress: false,
                last_reload: { succeeded: true, trigger: 'startup', reason: 'startup' },
              },
              import_state: {
                mode: 'startup_once',
                attempted: false,
                succeeded: false,
              },
            }),
            { status: 200 },
          ),
        );
      }
      if (url.includes('/api/config/domains')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              domains: [],
              runtime: {
                source_of_truth: 'sqlite',
                generation: 1,
                active_domain_keys: [],
                reload_in_progress: false,
                last_reload: { succeeded: true, trigger: 'startup', reason: 'startup' },
              },
              import_state: {
                mode: 'startup_once',
                attempted: false,
                succeeded: false,
              },
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    render(<App />);

    const sidebar = screen.getByRole('complementary', { name: /sidebar/i });
    const navigation = within(sidebar).getByLabelText(/primary navigation/i);

    fireEvent.click(within(navigation).getByRole('button', { name: /^chat$/i }));
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'ping' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByText('pong')).toBeInTheDocument();

    fireEvent.click(within(navigation).getByRole('button', { name: /connectors/i }));
    expect(await screen.findByRole('heading', { level: 2, name: /connectors config/i })).toBeInTheDocument();

    fireEvent.click(within(navigation).getByRole('button', { name: /^chat$/i }));
    expect(await screen.findByText('pong')).toBeInTheDocument();
  });
});
