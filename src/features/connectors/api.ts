import { getEnv } from '../../lib/env';
import type {
  ApiErrorEnvelope,
  ConnectorApiError,
  ConnectorDraft,
  ConnectorDraftInput,
  ConnectorsListResponse,
  ExportConnectorsResponse,
  ValidateConnectorsResponse,
} from './types';

type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: ConnectorApiError };

async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
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
      const envelope = parsed as ApiErrorEnvelope | null;
      return {
        data: null,
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

export function listConnectors() {
  return requestJson<ConnectorsListResponse>('/api/config/connectors');
}

export function getConnector(connectorId: string) {
  return requestJson<ConnectorDraft>(`/api/config/connectors/${encodeURIComponent(connectorId)}`);
}

export function createConnector(payload: ConnectorDraftInput) {
  return requestJson<ConnectorDraft>('/api/config/connectors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function replaceConnector(connectorId: string, payload: ConnectorDraftInput) {
  return requestJson<ConnectorDraft>(`/api/config/connectors/${encodeURIComponent(connectorId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteConnector(connectorId: string) {
  return requestJson<{ deleted: true; id: string }>(
    `/api/config/connectors/${encodeURIComponent(connectorId)}`,
    {
      method: 'DELETE',
    },
  );
}

export function validateConnectors() {
  return requestJson<ValidateConnectorsResponse>('/api/config/connectors/validate', {
    method: 'POST',
  });
}

export function exportConnectors() {
  return requestJson<ExportConnectorsResponse>('/api/config/connectors/export', {
    method: 'POST',
  });
}
