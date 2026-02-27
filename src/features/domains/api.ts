import { apiRequest } from '../../lib/api-client';
import { getEnv } from '../../lib/env';
import type { ApiResponse } from '../../types/api';
import type {
  AgentHealthSnapshot,
  CreateOrUpdateDomainResponse,
  DeleteDomainResponse,
  DomainApiError,
  DomainApiErrorEnvelope,
  DomainDraft,
  DomainDraftInput,
  DomainsListResponse,
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
