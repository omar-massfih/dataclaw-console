import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import App from './App';
import * as domainsApi from './features/domains/api';

describe('App', () => {
  it('renders connectors page heading inside app shell', async () => {
    vi.spyOn(domainsApi, 'fetchAvailableDomains').mockResolvedValue({
      data: { status: 'healthy', ready: true, domains: ['sql'] },
      error: null,
    });

    render(<App />);

    expect(screen.getByLabelText(/sidebar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/primary navigation/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /connectors config \(v1\)/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /^connectors$/i })).toBeInTheDocument();
  });
});
