import { apiRequest } from '../../lib/api-client';
import { getEnv } from '../../lib/env';
import type { ApiResponse } from '../../types/api';
import type {
  AgentHealthSnapshot,
  AgentToolInfo,
  CreateOrUpdateDomainResponse,
  DeleteDomainResponse,
  DomainApiError,
  DomainApiErrorEnvelope,
  DomainDraft,
  DomainDraftInput,
  DomainsListResponse,
  ListAgentToolsResponse,
} from './types';

type ApiResult<T> =
  | { data: T; error: null }
  | { data: T | null; error: DomainApiError };

function tryExtractErrorEnvelope(payload: unknown): DomainApiErrorEnvelope | null {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return null;
  const envelope = payload as DomainApiErrorEnvelope;
  if (!envelope.error || typeof envelope.error.message !== 'string') return null;
  return envelope;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  options?: { preserveDataOnError?: boolean },
): Promise<ApiResult<T>> {
  const { apiBaseUrl } = getEnv();

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const envelope = tryExtractErrorEnvelope(parsed);
      return {
        data: options?.preserveDataOnError ? (parsed as T) : null,
        error: {
          message: envelope?.error?.message ?? `Request failed with status ${response.status}`,
          code: envelope?.error?.code,
          param: envelope?.error?.param,
          status: response.status,
        },
      };
    }

    return { data: parsed as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown request error',
      },
    };
  }
}

// Legacy health-based helper retained for existing panel/tests.
export function fetchAvailableDomains(): Promise<ApiResponse<AgentHealthSnapshot>> {
  return apiRequest<AgentHealthSnapshot>('/api/agent/health');
}

export function listDomains() {
  return requestJson<DomainsListResponse>('/api/config/domains');
}

export function getDomain(domainKey: string) {
  return requestJson<DomainDraft>(`/api/config/domains/${encodeURIComponent(domainKey)}`);
}

export function createDomain(payload: DomainDraftInput) {
  return requestJson<CreateOrUpdateDomainResponse>(
    '/api/config/domains',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    { preserveDataOnError: true },
  );
}

export function replaceDomain(domainKey: string, payload: DomainDraftInput) {
  return requestJson<CreateOrUpdateDomainResponse>(
    `/api/config/domains/${encodeURIComponent(domainKey)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    { preserveDataOnError: true },
  );
}

export function deleteDomain(domainKey: string) {
  return requestJson<DeleteDomainResponse>(
    `/api/config/domains/${encodeURIComponent(domainKey)}`,
    {
      method: 'DELETE',
    },
    { preserveDataOnError: true },
  );
}

function extractTools(payload: unknown): AgentToolInfo[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return [];
  }
  const data = (payload as ListAgentToolsResponse).data;
  if (!Array.isArray(data)) {
    return [];
  }
  const mapped = data.map((item): AgentToolInfo | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const name = (item as { name?: unknown }).name;
      if (typeof name !== 'string' || !name.trim()) {
        return null;
      }
      const description = (item as { description?: unknown }).description;
      return {
        name: name.trim(),
        description: typeof description === 'string' ? description : '',
        arguments_schema: (item as { arguments_schema?: unknown }).arguments_schema ?? null,
      };
    });
  const tools = mapped.filter((item): item is AgentToolInfo => item !== null);
  return tools.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export async function listAgentTools(): Promise<{ data: AgentToolInfo[] | null; error: DomainApiError | null }> {
  const { apiBaseUrl } = getEnv();

  try {
    const response = await fetch(`${apiBaseUrl}/v1/tools`, { method: 'GET' });
    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: getErrorMessage(payload, `Tools request failed with status ${response.status}`),
          code: tryExtractErrorEnvelope(payload)?.error.code,
          param: tryExtractErrorEnvelope(payload)?.error.param,
          status: response.status,
        },
      };
    }

    return {
      data: extractTools(payload),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown tools request error',
      },
    };
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  const envelope = tryExtractErrorEnvelope(payload);
  if (envelope?.error.message) {
    return envelope.error.message;
  }
  return fallback;
}
