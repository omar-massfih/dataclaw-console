import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import * as domainsApi from './api';
import { AvailableDomainsPanel } from './AvailableDomainsPanel';

describe('AvailableDomainsPanel', () => {
  it('renders sorted domains and filters case-insensitively', async () => {
    vi.spyOn(domainsApi, 'fetchAvailableDomains').mockResolvedValue({
      data: { status: 'healthy', ready: true, domains: ['geo', 'sql', 'Kafka_ops'] },
      error: null,
    });

    render(<AvailableDomainsPanel />);

    const list = await screen.findByRole('list', { name: /available domain list/i });
    const items = Array.from(list.querySelectorAll('li'));
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(/geo/i);
    expect(items[1]).toHaveTextContent(/kafka_ops/i);
    expect(items[2]).toHaveTextContent(/sql/i);

    fireEvent.change(screen.getByLabelText(/filter domains/i), { target: { value: 'sq' } });

    expect(screen.getAllByText(/^sql$/i)).toHaveLength(2);
    expect(screen.queryByText(/^geo$/i)).not.toBeInTheDocument();
    expect(list.querySelectorAll('li')).toHaveLength(1);
  });
});
