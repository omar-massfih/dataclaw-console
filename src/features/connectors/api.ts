import { getEnv } from '../../lib/env';
import type {
  ApiErrorEnvelope,
  ConnectorApiError,
  ConnectorDraft,
  ConnectorDraftInput,
  ConnectorsListResponse,
  CreateOrUpdateConnectorResponse,
  DeleteConnectorResponse,
  ExportConnectorsResponse,
  ValidateConnectorsResponse,
} from './types';

type ApiResult<T> =
  | { data: T; error: null }
  | { data: T | null; error: ConnectorApiError };

function tryExtractErrorEnvelope(payload: unknown): ApiErrorEnvelope | null {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return null;
  const envelope = payload as ApiErrorEnvelope;
  if (!envelope.error || typeof envelope.error.message !== 'string') return null;
  return envelope;
}

async function requestJson<T>(path: string, init?: RequestInit, options?: { preserveDataOnError?: boolean }): Promise<ApiResult<T>> {
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

export function listConnectors() {
  return requestJson<ConnectorsListResponse>('/api/config/connectors');
}

export function getConnector(connectorId: string) {
  return requestJson<ConnectorDraft>(`/api/config/connectors/${encodeURIComponent(connectorId)}`);
}

export function createConnector(payload: ConnectorDraftInput) {
  return requestJson<CreateOrUpdateConnectorResponse>('/api/config/connectors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { preserveDataOnError: true });
}

export function replaceConnector(connectorId: string, payload: ConnectorDraftInput) {
  return requestJson<CreateOrUpdateConnectorResponse>(`/api/config/connectors/${encodeURIComponent(connectorId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, { preserveDataOnError: true });
}

export function deleteConnector(connectorId: string) {
  return requestJson<DeleteConnectorResponse>(
    `/api/config/connectors/${encodeURIComponent(connectorId)}`,
    {
      method: 'DELETE',
    },
    { preserveDataOnError: true },
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
