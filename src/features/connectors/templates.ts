import type { ConnectorKind } from './types';

export const CONNECTOR_SETTINGS_TEMPLATES: Record<ConnectorKind, Record<string, unknown>> = {
  sql_reader: {
    database_url: '',
    allowed_tables: [],
    enable_sql_text_tool: false,
    timeout_seconds: 30,
    source: 'sql_reader',
  },
  milvus: {
    uri: '',
    collections: [],
    database: 'default',
    timeout_seconds: 30,
    source: 'milvus',
  },
  kafka: {
    bootstrap_servers: [],
    allowed_topics: [],
    security_protocol: 'PLAINTEXT',
    client_id: 'dataclaw',
    request_timeout_ms: 30000,
    source: 'kafka',
  },
};

export function getConnectorSettingsTemplate(kind: ConnectorKind): Record<string, unknown> {
  return JSON.parse(JSON.stringify(CONNECTOR_SETTINGS_TEMPLATES[kind])) as Record<string, unknown>;
}

export function getConnectorSettingsTemplateText(kind: ConnectorKind): string {
  return JSON.stringify(CONNECTOR_SETTINGS_TEMPLATES[kind], null, 2);
}

export function normalizeJsonTextForTemplateComparison(settingsText: string): string | null {
  const trimmed = settingsText.trim();
  if (!trimmed) return '';

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
}

export function isDefaultConnectorSettingsText(kind: ConnectorKind, settingsText: string): boolean {
  const trimmed = settingsText.trim();
  if (!trimmed) return true;

  const normalized = normalizeJsonTextForTemplateComparison(settingsText);
  if (normalized === null) return false;
  if (normalized === '{}') return true;

  return normalized === getConnectorSettingsTemplateText(kind);
}
