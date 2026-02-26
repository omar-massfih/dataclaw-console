import { afterEach, describe, expect, it, vi } from 'vitest';

import { createConnector, listConnectors } from './api';

describe('connectors api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses normal list response envelopes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          connectors: [],
          runtime: { source_of_truth: 'sqlite', generation: 1, active_connector_ids: [], reload_in_progress: false },
          import_state: { mode: 'startup_once', attempted: false, succeeded: false },
        }),
        { status: 200 },
      ),
    );

    const result = await listConnectors();
    expect(fetchMock).toHaveBeenCalled();
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.connectors).toEqual([]);
    expect(result.data?.runtime.source_of_truth).toBe('sqlite');
  });

  it('preserves parsed mutation envelope data on non-2xx responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          saved: true,
          connector: {
            id: 'sql_reader_local',
            kind: 'sql_reader',
            enabled: true,
            settings: { database_url: 'sqlite:///tmp.db', allowed_tables: ['orders'] },
            created_at: '2026-02-26T00:00:00Z',
            updated_at: '2026-02-26T00:00:00Z',
          },
          reload: {
            attempted: true,
            succeeded: false,
            trigger: 'create',
            reason: 'enabled_connector_created',
            runtime: { source_of_truth: 'sqlite', generation: 2, active_connector_ids: [], reload_in_progress: false },
          },
          runtime: { source_of_truth: 'sqlite', generation: 2, active_connector_ids: [], reload_in_progress: false },
          import_state: { mode: 'startup_once', attempted: true, succeeded: true, last_import_result: 'imported' },
          error: {
            message: 'Connector saved but runtime reload failed',
            type: 'server_error',
            code: 'reload_failed_after_write',
          },
        }),
        { status: 500 },
      ),
    );

    const result = await createConnector({
      id: 'sql_reader_local',
      kind: 'sql_reader',
      enabled: true,
      settings: { database_url: 'sqlite:///tmp.db', allowed_tables: ['orders'] },
    });

    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(500);
    expect(result.data?.saved).toBe(true);
    expect(result.data?.error?.code).toBe('reload_failed_after_write');
  });

  it('returns strict error envelopes for non-mutation requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'Invalid request',
            type: 'invalid_request_error',
            code: 'invalid_request_error',
            param: 'id',
          },
        }),
        { status: 400 },
      ),
    );

    const result = await listConnectors();
    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('invalid_request_error');
    expect(result.data).toBeNull();
  });
});
