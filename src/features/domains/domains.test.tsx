import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import * as domainsApi from './api';
import { DomainsPage } from './DomainsPage';
import type {
  CreateOrUpdateDomainResponse,
  DeleteDomainResponse,
  DomainDraft,
  DomainImportStatePayload,
  DomainRuntimePayload,
} from './types';

const runtimePayload: DomainRuntimePayload = {
  source_of_truth: 'sqlite',
  generation: 3,
  last_reload: {
    at: '2026-02-26T00:00:00Z',
    succeeded: true,
    trigger: 'update',
    reason: 'domain_updated',
    error: null,
  },
  active_domain_keys: ['sql'],
  reload_in_progress: false,
};

const importStatePayload: DomainImportStatePayload = {
  mode: 'startup_once',
  source_path: '/tmp/domains.yaml',
  attempted: true,
  succeeded: true,
  last_imported_at: '2026-02-26T00:00:00Z',
  last_import_file_hash: 'abc123',
  last_import_result: 'imported',
  last_error: null,
};

const sqlDomain: DomainDraft = {
  key: 'sql',
  display_name: 'SQL',
  router_description: 'sql routing',
  step_decider_description: 'sql steps',
  router_examples: ['run sql'],
  supports_context_enrichment: true,
  is_recall_only: false,
  system_prompt: 'sql prompt',
  tool_names: ['db_query_sql'],
  routing_keywords: ['sql'],
  passthrough_tool_names: [],
  specialist_prompt_rules: [],
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
};

const geoDomain: DomainDraft = {
  key: 'geo',
  display_name: 'Geo',
  router_description: 'geo routing',
  step_decider_description: 'geo steps',
  router_examples: ['show map'],
  supports_context_enrichment: true,
  is_recall_only: false,
  system_prompt: 'geo prompt',
  tool_names: ['geo_show_map'],
  routing_keywords: ['geo'],
  passthrough_tool_names: ['geo_show_map'],
  specialist_prompt_rules: ['one call'],
  created_at: '2026-02-26T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
};

function mockList(domains = [sqlDomain, geoDomain]) {
  return vi.spyOn(domainsApi, 'listDomains').mockResolvedValue({
    data: { domains, runtime: runtimePayload, import_state: importStatePayload },
    error: null,
  });
}

function successMutationResponse(domain: DomainDraft): CreateOrUpdateDomainResponse {
  return {
    saved: true,
    domain,
    reload: {
      attempted: true,
      succeeded: true,
      trigger: 'create',
      reason: 'domain_created',
      runtime: runtimePayload,
    },
    runtime: runtimePayload,
    import_state: importStatePayload,
  };
}

describe('DomainsPage', () => {
  beforeEach(() => {
    vi.spyOn(domainsApi, 'listAgentTools').mockResolvedValue({
      data: [
        { name: 'db_query_sql', description: 'Query SQL', arguments_schema: { type: 'object' } },
        { name: 'db_list_tables', description: 'List tables', arguments_schema: { type: 'object' } },
        { name: 'geo_show_map', description: 'Show map', arguments_schema: { type: 'object' } },
      ],
      error: null,
    });
    vi.spyOn(domainsApi, 'searchDomainConfigs').mockResolvedValue({
      data: { query: '', index: 'domains', hits: [] },
      error: null,
    });
    vi.spyOn(domainsApi, 'searchToolConfigs').mockResolvedValue({
      data: { query: '', index: 'tools', hits: [] },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('loads list, supports filtering, and shows row actions only for selected row', async () => {
    mockList([sqlDomain, geoDomain]);

    render(<DomainsPage />);

    const list = await screen.findByRole('list', { name: /agent drafts/i });
    expect(within(list).getAllByRole('button').length).toBeGreaterThan(0);
    expect(screen.getByText(/runtime:\s*healthy/i)).toBeInTheDocument();
    expect(screen.getByText(/active agents:\s*1/i)).toBeInTheDocument();

    fireEvent.click(within(list).getByRole('button', { name: /^sql/i }));
    const selectedRow = within(list)
      .getAllByRole('button')
      .find((button) => button.className.includes('domains-list__row--selected'));
    await waitFor(() => {
      expect(selectedRow).toBeDefined();
      expect(selectedRow!.className).toContain('domains-list__row--active');
      expect(selectedRow!.className).toContain('domains-list__row--selected');
    });
    expect(await screen.findByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^delete$/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter agents/i), { target: { value: 'geo' } });
    expect(screen.getByLabelText(/filter agents/i)).toHaveValue('geo');
  });

  it('uses server-ranked domain search for non-empty query', async () => {
    mockList([sqlDomain, geoDomain]);
    const searchSpy = vi.spyOn(domainsApi, 'searchDomainConfigs').mockResolvedValue({
      data: {
        query: 'geo',
        index: 'domains',
        hits: [{ id: 'geo', score: 0.92, payload: { key: 'geo' } }],
      },
      error: null,
    });

    render(<DomainsPage />);
    await screen.findByRole('list', { name: /agent drafts/i });

    fireEvent.change(screen.getByLabelText(/filter agents/i), { target: { value: 'geo' } });

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith({ q: 'geo', top_k: 50, min_score: 0 });
    });

    const rows = screen.getAllByRole('button').filter((button) => button.className.includes('domains-list__row'));
    expect(rows.length).toBe(1);
    expect(rows[0]).toHaveTextContent(/^geo/i);
  });

  it('shows domain search warning and falls back to local list when search fails', async () => {
    mockList([sqlDomain, geoDomain]);
    vi.spyOn(domainsApi, 'searchDomainConfigs').mockResolvedValue({
      data: null,
      error: { message: 'Search backend unavailable', status: 500 },
    });

    render(<DomainsPage />);
    await screen.findByRole('list', { name: /agent drafts/i });

    fireEvent.change(screen.getByLabelText(/filter agents/i), { target: { value: 'geo' } });

    expect(await screen.findByText(/search is unavailable right now/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^geo/i })).toBeInTheDocument();
  });

  it('blocks save when key is missing and creates new domain draft', async () => {
    mockList([]);
    const createSpy = vi.spyOn(domainsApi, 'createDomain').mockResolvedValue({
      data: successMutationResponse(sqlDomain),
      error: null,
    });
    const listSpy = vi.spyOn(domainsApi, 'listDomains');
    listSpy
      .mockResolvedValueOnce({
        data: { domains: [], runtime: runtimePayload, import_state: importStatePayload },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { domains: [sqlDomain], runtime: runtimePayload, import_state: importStatePayload },
        error: null,
      });

    render(<DomainsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /create first agent/i }));
    expect(screen.getByRole('button', { name: /about basics section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about routing section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about tools section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about prompts section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about agent key/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about display name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about router description/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about tool names/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /about system prompt/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(await screen.findByText(/domain key is required/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: /^agent key$/i }), { target: { value: 'sql' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^display name$/i }), { target: { value: 'SQL' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^router description$/i }), { target: { value: 'sql routing' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^step decider description$/i }), { target: { value: 'sql step' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^system prompt$/i }), { target: { value: 'prompt' } });
    const toolNamesInput = screen.getByRole('combobox', { name: /^tool names$/i });
    fireEvent.change(toolNamesInput, { target: { value: 'db_query_sql' } });
    fireEvent.keyDown(toolNamesInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(createSpy).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /^saved$/i })).toBeInTheDocument();
  });

  it('opens edit form from list and keeps key locked', async () => {
    mockList([sqlDomain]);
    render(<DomainsPage />);

    const list = await screen.findByRole('list', { name: /agent drafts/i });
    fireEvent.click(within(list).getByRole('button', { name: /^sql/i }));
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    const keyInput = screen.getByRole('textbox', { name: /agent key/i });
    expect(keyInput).toBeDisabled();
    expect(screen.getByRole('button', { name: /back to agents list/i })).toBeInTheDocument();
  });

  it('supports inline delete and surfaces last-domain delete error', async () => {
    mockList([sqlDomain]);
    const deleteSpy = vi.spyOn(domainsApi, 'deleteDomain').mockResolvedValue({
      data: null,
      error: {
        message: 'At least one domain must remain configured',
        code: 'invalid_request_error',
        param: 'domain_key',
        status: 400,
      },
    });

    render(<DomainsPage />);
    const list = await screen.findByRole('list', { name: /agent drafts/i });
    fireEvent.click(within(list).getByRole('button', { name: /^sql/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    const confirmContainer = screen.getByRole('button', { name: /confirm delete/i }).closest('div');
    expect(confirmContainer?.className).toContain('domains-list__actions-confirm');
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('sql'));
    expect(await screen.findByText(/at least one domain must remain configured/i)).toBeInTheDocument();
  });

  it('handles committed-write reload failure for create', async () => {
    let created = false;
    const partialResponse: CreateOrUpdateDomainResponse = {
      saved: true,
      domain: sqlDomain,
      reload: {
        attempted: true,
        succeeded: false,
        trigger: 'create',
        reason: 'domain_created',
        runtime: runtimePayload,
      },
      runtime: runtimePayload,
      import_state: importStatePayload,
      error: {
        message: 'Domain saved but runtime reload failed',
        type: 'server_error',
        code: 'reload_failed_after_write',
      },
    };

    vi.spyOn(domainsApi, 'createDomain').mockImplementation(() => {
      created = true;
      return Promise.resolve({
        data: partialResponse,
        error: {
          message: 'Domain saved but runtime reload failed',
          code: 'reload_failed_after_write',
          status: 500,
        },
      });
    });

    vi.spyOn(domainsApi, 'listDomains').mockImplementation(() =>
      Promise.resolve({
        data: {
          domains: created ? [sqlDomain] : [],
          runtime: runtimePayload,
          import_state: importStatePayload,
        },
        error: null,
      }),
    );

    render(<DomainsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /create first agent/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /^agent key$/i }), { target: { value: 'sql' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect((await screen.findAllByText(/saved.*runtime reload failed/i)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^saved$/i })).toBeInTheDocument();
  });

  it('restores stored detail preference but falls back to list when no selection exists', async () => {
    window.localStorage.setItem('domains.viewMode.v1', 'detail');
    mockList([]);

    render(<DomainsPage />);

    expect(await screen.findByRole('heading', { level: 2, name: /^agents$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back to agents list/i })).not.toBeInTheDocument();
  });

  it('handles committed-write reload failure for delete', async () => {
    let deleted = false;
    vi.spyOn(domainsApi, 'listDomains').mockImplementation(() =>
      Promise.resolve({
        data: {
          domains: deleted ? [] : [sqlDomain],
          runtime: runtimePayload,
          import_state: importStatePayload,
        },
        error: null,
      }),
    );

    const deleteResponse: DeleteDomainResponse = {
      deleted: true,
      key: 'sql',
      reload: {
        attempted: true,
        succeeded: false,
        trigger: 'delete',
        reason: 'domain_deleted',
        runtime: runtimePayload,
      },
      runtime: runtimePayload,
      import_state: importStatePayload,
      error: {
        message: 'Domain deleted but runtime reload failed',
        type: 'server_error',
        code: 'reload_failed_after_write',
      },
    };

    const deleteSpy = vi.spyOn(domainsApi, 'deleteDomain').mockImplementation(() => {
      deleted = true;
      return Promise.resolve({
        data: deleteResponse,
        error: {
          message: 'Domain deleted but runtime reload failed',
          code: 'reload_failed_after_write',
          status: 500,
        },
      });
    });

    render(<DomainsPage />);
    const list = await screen.findByRole('list', { name: /agent drafts/i });
    fireEvent.click(within(list).getByRole('button', { name: /^sql/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('sql'));
    expect((await screen.findAllByText(/deleted but runtime reload failed/i)).length).toBeGreaterThan(0);
  });

  it('enforces passthrough as subset of selected tools', async () => {
    mockList([sqlDomain]);
    render(<DomainsPage />);

    const list = await screen.findByRole('list', { name: /agent drafts/i });
    fireEvent.click(within(list).getByRole('button', { name: /^sql/i }));
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    const passthroughInput = screen.getByRole('combobox', { name: /^passthrough tool names$/i });
    const toolInput = screen.getByRole('combobox', { name: /^tool names$/i });

    fireEvent.change(passthroughInput, { target: { value: 'geo_show_map' } });
    fireEvent.keyDown(passthroughInput, { key: 'Enter' });
    expect(await screen.findByText(/add passthrough tools from tool names only/i)).toBeInTheDocument();

    fireEvent.change(toolInput, { target: { value: 'geo_show_map' } });
    fireEvent.keyDown(toolInput, { key: 'Enter' });
    fireEvent.change(passthroughInput, { target: { value: 'geo_show_map' } });
    fireEvent.keyDown(passthroughInput, { key: 'Enter' });
    expect(screen.getByLabelText(/remove passthrough tool geo_show_map/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/remove tool geo_show_map/i));
    expect(screen.queryByLabelText(/remove passthrough tool geo_show_map/i)).not.toBeInTheDocument();
  });

  it('blocks adding unknown tool names when /v1/tools is unavailable', async () => {
    vi.spyOn(domainsApi, 'listAgentTools').mockResolvedValueOnce({
      data: null,
      error: { message: 'Tool registry is not available', status: 500 },
    });
    mockList([]);
    render(<DomainsPage />);

    fireEvent.click(await screen.findByRole('button', { name: /create first agent/i }));
    expect(await screen.findByText(/couldn.t load tool registry/i)).toBeInTheDocument();

    const toolInput = screen.getByRole('combobox', { name: /^tool names$/i });
    fireEvent.change(toolInput, { target: { value: 'manual_custom_tool' } });
    fireEvent.keyDown(toolInput, { key: 'Enter' });
    expect(await screen.findByText(/pick a tool from suggestions/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/remove tool manual_custom_tool/i)).not.toBeInTheDocument();
  });

  it('uses /search/tools for ranked suggestions and falls back when search fails', async () => {
    mockList([sqlDomain]);
    const searchToolsSpy = vi.spyOn(domainsApi, 'searchToolConfigs').mockResolvedValue({
      data: {
        query: 'db',
        index: 'tools',
        hits: [{ id: 'db_list_tables', score: 0.95, payload: { name: 'db_list_tables' } }],
      },
      error: null,
    });

    render(<DomainsPage />);

    const list = await screen.findByRole('list', { name: /agent drafts/i });
    fireEvent.click(within(list).getByRole('button', { name: /^sql/i }));
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    const toolInput = screen.getByRole('combobox', { name: /^tool names$/i });
    fireEvent.change(toolInput, { target: { value: 'db' } });

    await waitFor(() => expect(searchToolsSpy).toHaveBeenCalledWith({ q: 'db', top_k: 20, min_score: 0 }));
    expect(screen.getByRole('button', { name: /add tool db_list_tables/i })).toBeInTheDocument();

    searchToolsSpy.mockResolvedValueOnce({
      data: null,
      error: { message: 'Tool search failed', status: 500 },
    });
    fireEvent.change(toolInput, { target: { value: 'geo' } });

    expect(await screen.findByText(/tool search is unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add tool geo_show_map/i })).toBeInTheDocument();
  });
});
