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

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(await screen.findByText(/domain key is required/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/agent key/i), { target: { value: 'sql' } });
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'SQL' } });
    fireEvent.change(screen.getByLabelText(/router description/i), { target: { value: 'sql routing' } });
    fireEvent.change(screen.getByLabelText(/step decider description/i), { target: { value: 'sql step' } });
    fireEvent.change(screen.getByLabelText(/system prompt/i), { target: { value: 'prompt' } });
    fireEvent.change(screen.getByLabelText(/^tool names \(one per line\)$/i), { target: { value: 'db_query_sql' } });
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

    const keyInput = screen.getByLabelText(/agent key/i);
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
    fireEvent.change(screen.getByLabelText(/agent key/i), { target: { value: 'sql' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect((await screen.findAllByText(/saved but runtime reload failed/i)).length).toBeGreaterThan(0);
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
});
