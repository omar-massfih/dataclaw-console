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

const sqlConnector: ConnectorDraft = {
  id: 'sql_reader_local',
  kind: 'sql_reader' as const,
  enabled: true,
  settings: { database_url: 'sqlite:///tmp.db', allowed_tables: ['orders'] },
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
  runtime_active: false,
  runtime_loaded: false,
};

const kafkaConnector: ConnectorDraft = {
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

function mockList(connectors: ConnectorDraft[] = [sqlConnector, kafkaConnector]) {
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

  it('loads the connectors table, supports filtering, and keeps row actions inline', async () => {
    mockList([sqlConnector, kafkaConnector]);

    render(<ConnectorsPage />);

    const table = await screen.findByRole('table', { name: /connector drafts/i });
    expect(screen.getByLabelText(/filter connectors/i)).toHaveAttribute('placeholder', 'Search by id or kind');
    expect(screen.getByText(/runtime healthy/i)).toBeInTheDocument();
    expect(screen.getByText(/1 active/i)).toBeInTheDocument();
    expect(screen.getByText(/last reload ok/i)).toBeInTheDocument();
    expect(within(table).getAllByText(/^error \(runtime\)$/i)).toHaveLength(2);
    expect(within(table).queryByText(/^enabled$/i)).not.toBeInTheDocument();
    expect(within(table).queryByText(/^runtime active$/i)).not.toBeInTheDocument();
    expect(table.querySelectorAll('.data-table__menu-trigger')).toHaveLength(2);

    fireEvent.change(screen.getByLabelText(/filter connectors/i), { target: { value: 'sql' } });
    expect(screen.getByLabelText(/filter connectors/i)).toHaveValue('sql');
    expect(screen.getByRole('button', { name: /clear connector search/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /clear connector search/i }));
    expect(screen.getByLabelText(/filter connectors/i)).toHaveValue('');
  });

  it('renders a single disabled status chip for non-running disabled connectors', async () => {
    const disabledConnector: ConnectorDraft = {
      ...kafkaConnector,
      id: 'kafka_disabled',
      enabled: false,
      runtime_active: false,
      runtime_loaded: false,
    };
    mockList([disabledConnector]);

    render(<ConnectorsPage />);

    const table = await screen.findByRole('table', { name: /connector drafts/i });
    expect(within(table).queryAllByText(/^disabled$/i).length).toBeGreaterThan(0);
    expect(within(table).queryByText(/^runtime active$/i)).not.toBeInTheDocument();
  });

  it('renders form-based settings editors, allows TLS selection in create mode, and removes SSL path input', async () => {
    mockList([]);

    render(<ConnectorsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));

    expect(screen.queryByLabelText(/settings \(json\)/i)).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^database url$/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^allowed tables \(one per line\)$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about basics section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about settings section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about sql reader section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about connector id/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about kind/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about enabled/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about database url/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about allowed tables/i })).toBeInTheDocument();

    const kindSelect = screen.getByRole('combobox', { name: /^kind$/i });
    fireEvent.change(kindSelect, { target: { value: 'kafka' } });

    expect(screen.getByRole('textbox', { name: /^bootstrap servers \(one host:port per line\)$/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^allowed topics \(one per line\)$/i })).toBeInTheDocument();
    const protocolSelect = screen.getByRole('combobox', { name: /^security protocol$/i });
    expect(protocolSelect).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about kafka section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about bootstrap servers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about allowed topics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about security protocol/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about ssl ca certificate/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /about sasl username/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/sasl username/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ssl ca file path/i)).not.toBeInTheDocument();
    expect(screen.getByText(/enter connector id first, then upload the certificate/i)).toBeInTheDocument();
    expect(within(protocolSelect).getByRole('option', { name: 'SSL' })).toBeEnabled();
    expect(within(protocolSelect).getByRole('option', { name: 'SASL_SSL' })).toBeEnabled();

    fireEvent.change(protocolSelect, { target: { value: 'SASL_SSL' } });
    expect(screen.getByRole('button', { name: /about sasl mechanism/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about sasl username/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about sasl password/i })).toBeInTheDocument();
  });

  it('uploads kafka ssl cert in persisted plaintext mode and handles committed reload failure', async () => {
    const listSpy = vi.spyOn(connectorsApi, 'listConnectors');
    const kafkaPlaintextConnectorWithCert: ConnectorDraft = {
      ...kafkaConnector,
      enabled: true,
      settings: {
        ...kafkaConnector.settings,
        security_protocol: 'PLAINTEXT',
        ssl_cafile: '/tmp/certs/kafka_demo.crt',
      },
    };
    listSpy
      .mockResolvedValueOnce({
        data: { connectors: [kafkaConnector], runtime: runtimePayload, import_state: importStatePayload },
        error: null,
      })
      .mockResolvedValue({
        data: { connectors: [kafkaPlaintextConnectorWithCert], runtime: runtimePayload, import_state: importStatePayload },
        error: null,
      });

    const uploadSpy = vi.spyOn(connectorsApi, 'uploadConnectorSslCafile').mockResolvedValue({
      data: {
        uploaded: true,
        connector: kafkaPlaintextConnectorWithCert,
        file: {
          path: '/tmp/certs/kafka_demo.crt',
          size_bytes: 512,
          sha256: '1234567890abcdef1234567890abcdef',
        },
        reload: {
          attempted: true,
          succeeded: false,
          trigger: 'update',
          reason: 'enabled_connector_config_changed',
          runtime: runtimePayload,
        },
        runtime: runtimePayload,
        import_state: importStatePayload,
        error: {
          message: 'SSL CA file uploaded but runtime reload failed',
          type: 'server_error',
          code: 'reload_failed_after_write',
        },
      },
      error: {
        message: 'SSL CA file uploaded but runtime reload failed',
        code: 'reload_failed_after_write',
        status: 500,
      },
    });

    render(<ConnectorsPage />);
    const table = await screen.findByRole('table', { name: /connector drafts/i });
    fireEvent.click(within(table).getByLabelText(/open actions for kafka_demo/i));
    fireEvent.click(within(table).getByLabelText(/edit kafka_demo/i));

    const file = new File(['-----BEGIN CERTIFICATE-----'], 'ca.pem', { type: 'application/x-pem-file' });
    const fileInput = screen.getByLabelText(/ssl ca certificate/i, { selector: 'input[type="file"]' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload certificate/i }));

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledWith('kafka_demo', expect.any(File)));
    expect((await screen.findAllByText(/uploaded but runtime reload failed/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/current ca file: \/tmp\/certs\/kafka_demo\.crt/i)).toBeInTheDocument();
    expect(screen.getByText(/plaintext does not use it until you switch to ssl\/sasl_ssl/i)).toBeInTheDocument();
  });

  it('uploads kafka ssl cert in create mode by staging cert path only', async () => {
    mockList([]);
    const uploadStagedSpy = vi.spyOn(connectorsApi, 'uploadStagedSslCafile').mockResolvedValue({
      data: {
        uploaded: true,
        file: {
          path: '/tmp/certs/kafka_unsaved.crt',
          size_bytes: 512,
          sha256: 'abcdef1234567890abcdef1234567890',
        },
      },
      error: null,
    });
    const uploadPersistedSpy = vi.spyOn(connectorsApi, 'uploadConnectorSslCafile').mockResolvedValue({
      data: {
        uploaded: true,
        connector: kafkaConnector,
        file: {
          path: '/tmp/certs/kafka_demo.crt',
          size_bytes: 512,
          sha256: '1234567890abcdef1234567890abcdef',
        },
        reload: {
          attempted: false,
          succeeded: false,
          trigger: 'update',
          reason: 'disabled_only_update',
          runtime: runtimePayload,
        },
        runtime: runtimePayload,
        import_state: importStatePayload,
      },
      error: null,
    });

    render(<ConnectorsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /create first connector/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /^connector id$/i }), { target: { value: 'kafka_unsaved' } });
    fireEvent.change(screen.getByRole('combobox', { name: /^kind$/i }), { target: { value: 'kafka' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^bootstrap servers/i }), {
      target: { value: 'localhost:9092' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /^allowed topics/i }), {
      target: { value: 'ship_events' },
    });

    const file = new File(['-----BEGIN CERTIFICATE-----'], 'ca.pem', { type: 'application/x-pem-file' });
    const fileInput = screen.getByLabelText(/ssl ca certificate/i, { selector: 'input[type="file"]' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /upload certificate/i }));

    await waitFor(() => expect(uploadStagedSpy).toHaveBeenCalledTimes(1));
    expect(uploadStagedSpy).toHaveBeenCalledWith(expect.any(File), 'kafka_unsaved');
    expect(uploadPersistedSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/current ca file: \/tmp\/certs\/kafka_unsaved\.crt/i)).toBeInTheDocument();
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

    fireEvent.change(screen.getByRole('textbox', { name: /^connector id$/i }), { target: { value: 'milvus_demo' } });
    fireEvent.change(screen.getByRole('combobox', { name: /^kind$/i }), { target: { value: 'milvus' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect((await screen.findAllByText(/milvus uri is required/i)).length).toBeGreaterThan(0);
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: /^milvus uri$/i }), { target: { value: 'http://localhost:19530' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^collections \(one per line\)$/i }), { target: { value: 'ships' } });
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
    fireEvent.change(screen.getByRole('textbox', { name: /^connector id$/i }), { target: { value: 'sql_reader_new' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^database url$/i }), { target: { value: 'sqlite:///tmp.db' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^allowed tables \(one per line\)$/i }), { target: { value: 'orders' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect((await screen.findAllByText(/saved but runtime reload failed/i)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^saved$/i })).toBeInTheDocument();
    expect(screen.getByText(/edit connector: sql_reader_new/i)).toBeInTheDocument();
  });

  it('opens detail edit from the row name and locks id/kind in edit mode', async () => {
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
    const table = await screen.findByRole('table', { name: /connector drafts/i });
    fireEvent.click(within(table).getByRole('button', { name: /^sql_reader_local$/i }));
    expect(screen.getByRole('button', { name: /back to connectors list/i })).toBeInTheDocument();

    const idInput = screen.getByRole('textbox', { name: /^connector id$/i });
    const kindSelect = screen.getByRole('combobox', { name: /kind/i });
    expect(idInput).toBeDisabled();
    expect(kindSelect).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /^database url$/i })).toHaveValue('sqlite:///tmp.db');

    fireEvent.change(screen.getByRole('textbox', { name: /^allowed tables \(one per line\)$/i }), { target: { value: 'orders\nshipments' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('button', { name: /back to connectors list/i })).not.toBeInTheDocument();
    const refreshedTable = await screen.findByRole('table', { name: /connector drafts/i });
    fireEvent.click(within(refreshedTable).getByLabelText(/open actions for sql_reader_local/i));
    fireEvent.click(within(refreshedTable).getByLabelText(/edit sql_reader_local/i));
    fireEvent.change(screen.getByRole('textbox', { name: /^allowed tables \(one per line\)$/i }), { target: { value: 'orders\nshipments' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(connectorsApi.replaceConnector).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /^saved$/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /^allowed tables \(one per line\)$/i }), { target: { value: 'orders' } });
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
    const table = await screen.findByRole('table', { name: /connector drafts/i });
    fireEvent.click(within(table).getByLabelText(/open actions for sql_reader_local/i));
    fireEvent.click(within(table).getByLabelText(/delete sql_reader_local/i));
    expect(within(table).getByRole('button', { name: /confirm delete sql_reader_local/i })).toBeInTheDocument();
    fireEvent.click(within(table).getByRole('button', { name: /cancel delete sql_reader_local/i }));
    expect(within(table).queryByRole('button', { name: /confirm delete sql_reader_local/i })).not.toBeInTheDocument();

    fireEvent.click(within(table).getByLabelText(/open actions for sql_reader_local/i));
    fireEvent.click(within(table).getByLabelText(/delete sql_reader_local/i));
    fireEvent.click(within(table).getByRole('button', { name: /confirm delete sql_reader_local/i }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('sql_reader_local'));
    expect((await screen.findAllByText(/deleted but runtime reload failed/i)).length).toBeGreaterThan(0);
  });

  it('restores stored detail preference but falls back to list when no selection exists', async () => {
    window.localStorage.setItem('connectors.viewMode.v1', 'detail');
    mockList([]);

    render(<ConnectorsPage />);

    expect(await screen.findByRole('heading', { level: 2, name: /^connectors config$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back to connectors list/i })).not.toBeInTheDocument();
  });
});
