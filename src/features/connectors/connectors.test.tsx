import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import * as connectorsApi from './api';
import { ConnectorsPage } from './ConnectorsPage';
import { getConnectorSettingsTemplateText } from './templates';

const sqlConnector = {
  id: 'sql_reader_local',
  kind: 'sql_reader' as const,
  enabled: true,
  settings: { database_url: 'sqlite:///tmp.db', allowed_tables: ['orders'] },
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
};

const kafkaConnector = {
  id: 'kafka_demo',
  kind: 'kafka' as const,
  enabled: false,
  settings: { bootstrap_servers: ['localhost:9092'], allowed_topics: ['ship_events'] },
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
};

function mockList(connectors = [sqlConnector, kafkaConnector]) {
  return vi.spyOn(connectorsApi, 'listConnectors').mockResolvedValue({
    data: { connectors },
    error: null,
  });
}

describe('ConnectorsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads, sorts, and filters connectors', async () => {
    mockList([sqlConnector, kafkaConnector]);

    render(<ConnectorsPage />);

    expect(await screen.findByText(/^kafka_demo$/i)).toBeInTheDocument();
    expect(screen.getByText(/^sql_reader_local$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter connectors/i), { target: { value: 'sql' } });

    const list = screen.getByRole('list', { name: /connector drafts/i });
    expect(within(list).getByText(/^sql_reader_local$/i)).toBeInTheDocument();
    expect(within(list).queryByText(/^kafka_demo$/i)).not.toBeInTheDocument();
  });

  it('blocks save on invalid JSON and creates connector on valid JSON', async () => {
    mockList([]);
    vi.spyOn(connectorsApi, 'createConnector').mockResolvedValue({
      data: {
        ...sqlConnector,
        id: 'milvus_demo',
        kind: 'milvus',
        settings: { uri: 'http://localhost:19530', collections: ['ships'] },
      },
      error: null,
    });
    vi.spyOn(connectorsApi, 'replaceConnector');
    const listSpy = vi.spyOn(connectorsApi, 'listConnectors');
    listSpy
      .mockResolvedValueOnce({ data: { connectors: [] }, error: null })
      .mockResolvedValueOnce({
        data: {
          connectors: [
            {
              ...sqlConnector,
              id: 'milvus_demo',
              kind: 'milvus',
              settings: { uri: 'http://localhost:19530', collections: ['ships'] },
            },
          ],
        },
        error: null,
      });

    render(<ConnectorsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));

    fireEvent.change(screen.getByLabelText(/connector id/i), { target: { value: 'milvus_demo' } });
    fireEvent.change(screen.getByLabelText(/^kind$/i), { target: { value: 'milvus' } });
    fireEvent.change(screen.getByLabelText(/settings \(json\)/i), { target: { value: '{bad' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/expected property name|invalid json/i)).toBeInTheDocument();
    expect(connectorsApi.createConnector).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/settings \(json\)/i), {
      target: { value: '{\n  "uri": "http://localhost:19530",\n  "collections": ["ships"]\n}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(connectorsApi.createConnector).toHaveBeenCalled();
    });
  });

  it('prefills settings from kind templates and preserves edited JSON on kind change', async () => {
    mockList([]);

    render(<ConnectorsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));

    const kindSelect = screen.getByLabelText(/^kind$/i);
    const settingsInput = screen.getByLabelText(/settings \(json\)/i);

    expect(kindSelect.value).toBe('sql_reader');
    expect(settingsInput.value).toBe(getConnectorSettingsTemplateText('sql_reader'));

    fireEvent.change(kindSelect, { target: { value: 'milvus' } });
    expect(settingsInput.value).toBe(getConnectorSettingsTemplateText('milvus'));

    fireEvent.change(settingsInput, {
      target: {
        value: '{\n  "uri": "http://localhost:19530",\n  "collections": ["ships"],\n  "note": "edited"\n}',
      },
    });
    fireEvent.change(kindSelect, { target: { value: 'kafka' } });

    expect(settingsInput.value).toContain('"note": "edited"');
    expect(settingsInput.value).not.toBe(getConnectorSettingsTemplateText('kafka'));
  });

  it('resets settings JSON to the selected kind template', async () => {
    mockList([]);

    render(<ConnectorsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));

    const kindSelect = screen.getByLabelText(/^kind$/i);
    const settingsInput = screen.getByLabelText(/settings \(json\)/i);

    fireEvent.change(kindSelect, { target: { value: 'kafka' } });
    fireEvent.change(settingsInput, { target: { value: '{bad' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(await screen.findByText(/expected property name|invalid json/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset to kafka template/i }));

    expect(settingsInput.value).toBe(getConnectorSettingsTemplateText('kafka'));
    await waitFor(() => {
      expect(screen.queryByText(/expected property name|invalid json/i)).not.toBeInTheDocument();
    });
  });

  it('supports validate and export actions', async () => {
    mockList([sqlConnector]);
    vi.spyOn(connectorsApi, 'validateConnectors').mockResolvedValue({
      data: { validated: true, connector_count: 1, connector_ids: ['sql_reader_local'] },
      error: null,
    });
    vi.spyOn(connectorsApi, 'exportConnectors').mockResolvedValue({
      data: {
        yaml: 'connectors:\n  - id: sql_reader_local\n',
        connector_count: 1,
        connector_ids: ['sql_reader_local'],
        validated: true,
      },
      error: null,
    });

    render(<ConnectorsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /validate all/i }));
    expect(await screen.findByText(/validated 1 connector/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /export yaml/i }));
    expect(await screen.findByText(/connectors:/i)).toBeInTheDocument();
  });
});
