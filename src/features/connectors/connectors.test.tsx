import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import * as connectorsApi from './api';
import { ConnectorsPage } from './ConnectorsPage';
import type {
  ConnectorDraft,
  CreateOrUpdateConnectorResponse,
  DeleteConnectorResponse,
  ImportStatePayload,
  RuntimePayload,
} from './types';

const runtimePayload: RuntimePayload = {
  source_of_truth: 'sqlite',
  generation: 3,
  last_reload: {
    at: '2026-02-26T00:00:00Z',
    succeeded: true,
    trigger: 'update',
    reason: 'enabled_connector_config_changed',
    error: null,
  },
  active_connector_ids: ['kafka_demo'],
  reload_in_progress: false,
};

const importStatePayload: ImportStatePayload = {
  mode: 'startup_once',
  source_path: '/tmp/connectors.yaml',
  attempted: true,
  succeeded: true,
  last_imported_at: '2026-02-26T00:00:00Z',
  last_import_file_hash: 'abc123',
  last_import_result: 'imported',
  last_error: null,
};

const sqlConnector = {
  id: 'sql_reader_local',
  kind: 'sql_reader' as const,
  enabled: true,
  settings: { database_url: 'sqlite:///tmp.db', allowed_tables: ['orders'] },
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
  runtime_active: false,
  runtime_loaded: false,
};

const kafkaConnector = {
  id: 'kafka_demo',
  kind: 'kafka' as const,
  enabled: false,
  settings: {
    bootstrap_servers: ['localhost:9092'],
    allowed_topics: ['ship_events'],
    security_protocol: 'PLAINTEXT',
  },
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
  runtime_active: true,
  runtime_loaded: true,
};

function mockList(connectors = [sqlConnector, kafkaConnector]) {
  return vi.spyOn(connectorsApi, 'listConnectors').mockResolvedValue({
    data: { connectors, runtime: runtimePayload, import_state: importStatePayload },
    error: null,
  });
}

function successMutationResponse(connector: ConnectorDraft): CreateOrUpdateConnectorResponse {
  return {
    saved: true,
    connector,
    reload: {
      attempted: true,
      succeeded: true,
      trigger: 'create',
      reason: 'enabled_connector_created',
      runtime: runtimePayload,
    },
    runtime: runtimePayload,
    import_state: importStatePayload,
  };
}

describe('ConnectorsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('loads list, supports filtering, and shows row actions only for selected row', async () => {
    mockList([sqlConnector, kafkaConnector]);

    render(<ConnectorsPage />);

    const list = await screen.findByRole('list', { name: /connector drafts/i });
    expect(within(list).getAllByRole('button').length).toBeGreaterThan(0);
    expect(screen.getByText(/runtime:\s*healthy/i)).toBeInTheDocument();
    expect(screen.getByText(/active connectors:\s*1/i)).toBeInTheDocument();

    fireEvent.click(within(list).getByRole('button', { name: /sql_reader_local/i }));
    expect(await screen.findByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back to connectors list/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter connectors/i), { target: { value: 'sql' } });
    expect(screen.getByLabelText(/filter connectors/i)).toHaveValue('sql');
  });

  it('renders form-based settings editors and kafka progressive fields', async () => {
    mockList([]);

    render(<ConnectorsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));

    expect(screen.queryByLabelText(/settings \(json\)/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/database url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/allowed tables/i)).toBeInTheDocument();

    const kindSelect = screen.getByLabelText(/^kind$/i);
    fireEvent.change(kindSelect, { target: { value: 'kafka' } });

    expect(screen.getByLabelText(/bootstrap servers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/allowed topics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/security protocol/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/sasl username/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ssl ca file path/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/security protocol/i), { target: { value: 'SASL_SSL' } });
    expect(screen.getByLabelText(/sasl username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sasl password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ssl ca file path/i)).toBeInTheDocument();
  });

  it('blocks save on invalid fields and creates connector from typed form values', async () => {
    mockList([]);
    const createSpy = vi.spyOn(connectorsApi, 'createConnector').mockResolvedValue({
      data: successMutationResponse({
        ...sqlConnector,
        id: 'milvus_demo',
        kind: 'milvus',
        settings: { uri: 'http://localhost:19530', collections: ['ships'] },
      }),
      error: null,
    });
    const listSpy = vi.spyOn(connectorsApi, 'listConnectors');
    listSpy
      .mockResolvedValueOnce({
        data: { connectors: [], runtime: runtimePayload, import_state: importStatePayload },
        error: null,
      })
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
          runtime: runtimePayload,
          import_state: importStatePayload,
        },
        error: null,
      });

    render(<ConnectorsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));

    fireEvent.change(screen.getByLabelText(/connector id/i), { target: { value: 'milvus_demo' } });
    fireEvent.change(screen.getByLabelText(/^kind$/i), { target: { value: 'milvus' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect((await screen.findAllByText(/milvus uri is required/i)).length).toBeGreaterThan(0);
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/milvus uri/i), { target: { value: 'http://localhost:19530' } });
    fireEvent.change(screen.getByLabelText(/collections \(one per line\)/i), { target: { value: 'ships' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
    });
    const payload = createSpy.mock.calls.at(-1)?.[0];
    expect(payload).toMatchObject({
      id: 'milvus_demo',
      kind: 'milvus',
      enabled: true,
    });
    expect(payload?.settings).toMatchObject({
      uri: 'http://localhost:19530',
      collections: ['ships'],
    });
  });

  it('handles reload failure after committed create mutation', async () => {
    let created = false;

    const partialResponse: CreateOrUpdateConnectorResponse = {
      saved: true,
      connector: {
        ...sqlConnector,
        id: 'sql_reader_new',
      },
      reload: {
        attempted: true,
        succeeded: false,
        trigger: 'create',
        reason: 'enabled_connector_created',
        runtime: runtimePayload,
        error: { type: 'RuntimeError', message: 'Runtime reload failed after SQLite mutation.' },
      },
      runtime: runtimePayload,
      import_state: importStatePayload,
      error: {
        message: 'Connector saved but runtime reload failed',
        type: 'server_error',
        code: 'reload_failed_after_write',
        param: null,
      },
    };

    vi.spyOn(connectorsApi, 'createConnector').mockImplementation(() => {
      created = true;
      return Promise.resolve({
        data: partialResponse,
        error: {
          message: 'Connector saved but runtime reload failed',
          code: 'reload_failed_after_write',
          status: 500,
        },
      });
    });

    vi.spyOn(connectorsApi, 'listConnectors').mockImplementation(() =>
      Promise.resolve({
        data: {
          connectors: created ? [partialResponse.connector] : [],
          runtime: runtimePayload,
          import_state: importStatePayload,
        },
        error: null,
      }),
    );

    render(<ConnectorsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));
    fireEvent.change(screen.getByLabelText(/connector id/i), { target: { value: 'sql_reader_new' } });
    fireEvent.change(screen.getByLabelText(/database url/i), { target: { value: 'sqlite:///tmp.db' } });
    fireEvent.change(screen.getByLabelText(/allowed tables/i), { target: { value: 'orders' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect((await screen.findAllByText(/saved but runtime reload failed/i)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^saved$/i })).toBeInTheDocument();
    expect(screen.getByText(/edit connector: sql_reader_new/i)).toBeInTheDocument();
  });

  it('opens detail edit from list actions and locks id/kind in edit mode', async () => {
    mockList([sqlConnector]);
    vi.spyOn(connectorsApi, 'replaceConnector').mockResolvedValue({
      data: successMutationResponse({
        ...sqlConnector,
        settings: { database_url: 'sqlite:///tmp.db', allowed_tables: ['orders', 'shipments'] },
      }),
      error: null,
    });
    const listSpy = vi.spyOn(connectorsApi, 'listConnectors');
    listSpy
      .mockResolvedValueOnce({
        data: { connectors: [sqlConnector], runtime: runtimePayload, import_state: importStatePayload },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          connectors: [
            {
              ...sqlConnector,
              settings: { database_url: 'sqlite:///tmp.db', allowed_tables: ['orders', 'shipments'] },
            },
          ],
          runtime: runtimePayload,
          import_state: importStatePayload,
        },
        error: null,
      });

    render(<ConnectorsPage />);
    const list = await screen.findByRole('list', { name: /connector drafts/i });
    fireEvent.click(within(list).getByRole('button', { name: /sql_reader_local/i }));
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByRole('button', { name: /back to connectors list/i })).toBeInTheDocument();

    const idInput = screen.getByLabelText(/connector id/i);
    const kindSelect = screen.getByRole('combobox', { name: /kind/i });
    expect(idInput).toBeDisabled();
    expect(kindSelect).toBeDisabled();
    expect(screen.getByLabelText(/database url/i)).toHaveValue('sqlite:///tmp.db');

    fireEvent.change(screen.getByLabelText(/allowed tables/i), { target: { value: 'orders\nshipments' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('button', { name: /back to connectors list/i })).not.toBeInTheDocument();
    const refreshedList = await screen.findByRole('list', { name: /connector drafts/i });
    fireEvent.click(within(refreshedList).getByRole('button', { name: /sql_reader_local/i }));
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    fireEvent.change(screen.getByLabelText(/allowed tables/i), { target: { value: 'orders\nshipments' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(connectorsApi.replaceConnector).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /^saved$/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/allowed tables/i), { target: { value: 'orders' } });
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('supports inline delete confirm flow and handles reload failure after committed delete mutation', async () => {
    let deleted = false;
    vi.spyOn(connectorsApi, 'listConnectors').mockImplementation(() =>
      Promise.resolve({
        data: {
          connectors: deleted ? [] : [sqlConnector],
          runtime: runtimePayload,
          import_state: importStatePayload,
        },
        error: null,
      }),
    );

    const deleteResponse: DeleteConnectorResponse = {
      deleted: true,
      id: 'sql_reader_local',
      reload: {
        attempted: true,
        succeeded: false,
        trigger: 'delete',
        reason: 'enabled_connector_deleted',
        runtime: runtimePayload,
        error: { type: 'RuntimeError', message: 'Runtime reload failed after SQLite mutation.' },
      },
      runtime: runtimePayload,
      import_state: importStatePayload,
      error: {
        message: 'Connector deleted but runtime reload failed',
        type: 'server_error',
        code: 'reload_failed_after_write',
      },
    };

    const deleteSpy = vi.spyOn(connectorsApi, 'deleteConnector').mockImplementation(() => {
      deleted = true;
      return Promise.resolve({
        data: deleteResponse,
        error: {
          message: 'Connector deleted but runtime reload failed',
          code: 'reload_failed_after_write',
          status: 500,
        },
      });
    });

    render(<ConnectorsPage />);
    const list = await screen.findByRole('list', { name: /connector drafts/i });
    fireEvent.click(within(list).getByRole('button', { name: /sql_reader_local/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /confirm delete/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('sql_reader_local'));
    expect((await screen.findAllByText(/deleted but runtime reload failed/i)).length).toBeGreaterThan(0);
  });

  it('restores stored detail preference but falls back to list when no selection exists', async () => {
    window.localStorage.setItem('connectors.viewMode.v1', 'detail');
    mockList([]);

    render(<ConnectorsPage />);

    expect(await screen.findByRole('heading', { level: 2, name: /^connectors$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back to connectors list/i })).not.toBeInTheDocument();
  });
});
