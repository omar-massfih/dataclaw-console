import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDomain, listAgentTools, listDomains } from './api';

describe('domains api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses normal list response envelopes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          domains: [],
          runtime: { source_of_truth: 'sqlite', generation: 1, active_domain_keys: [], reload_in_progress: false },
          import_state: { mode: 'startup_once', attempted: false, succeeded: false },
        }),
        { status: 200 },
      ),
    );

    const result = await listDomains();
    expect(fetchMock).toHaveBeenCalled();
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.domains).toEqual([]);
    expect(result.data?.runtime.source_of_truth).toBe('sqlite');
  });

  it('preserves parsed mutation envelope data on non-2xx responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          saved: true,
          domain: {
            key: 'sql',
            display_name: 'SQL',
            router_description: 'r',
            step_decider_description: 's',
            router_examples: [],
            supports_context_enrichment: true,
            is_recall_only: false,
            system_prompt: 'prompt',
            tool_names: ['db_query_sql'],
            routing_keywords: [],
            passthrough_tool_names: [],
            specialist_prompt_rules: [],
            created_at: '2026-02-26T00:00:00Z',
            updated_at: '2026-02-26T00:00:00Z',
          },
          reload: {
            attempted: true,
            succeeded: false,
            trigger: 'create',
            reason: 'domain_created',
            runtime: { source_of_truth: 'sqlite', generation: 2, active_domain_keys: [], reload_in_progress: false },
          },
          runtime: { source_of_truth: 'sqlite', generation: 2, active_domain_keys: [], reload_in_progress: false },
          import_state: { mode: 'startup_once', attempted: true, succeeded: true, last_import_result: 'imported' },
          error: {
            message: 'Domain saved but runtime reload failed',
            type: 'server_error',
            code: 'reload_failed_after_write',
          },
        }),
        { status: 500 },
      ),
    );

    const result = await createDomain({
      key: 'sql',
      display_name: 'SQL',
      router_description: 'r',
      step_decider_description: 's',
      router_examples: [],
      supports_context_enrichment: true,
      is_recall_only: false,
      system_prompt: 'prompt',
      tool_names: ['db_query_sql'],
      routing_keywords: [],
      passthrough_tool_names: [],
      specialist_prompt_rules: [],
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
            param: 'key',
          },
        }),
        { status: 400 },
      ),
    );

    const result = await listDomains();
    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe('invalid_request_error');
    expect(result.data).toBeNull();
  });

  it('parses tools list from /v1/tools', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          object: 'list',
          data: [
            { name: 'db_query_sql', description: 'Query SQL', arguments_schema: { type: 'object' } },
            { name: 'geo_show_map', description: 'Show map', arguments_schema: { type: 'object' } },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await listAgentTools();
    expect(fetchMock).toHaveBeenCalled();
    expect(result.error).toBeNull();
    expect(result.data?.map((tool) => tool.name)).toEqual(['db_query_sql', 'geo_show_map']);
  });

  it('returns tool endpoint errors without breaking form fallback', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'Tool registry is not available',
            type: 'invalid_request_error',
            code: 'internal_error',
          },
        }),
        { status: 500 },
      ),
    );

    const result = await listAgentTools();
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Tool registry is not available');
    expect(result.error?.status).toBe(500);
  });
});
