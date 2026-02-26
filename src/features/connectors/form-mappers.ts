import type {
  ConnectorDraft,
  ConnectorFormDraft,
  ConnectorKind,
  ConnectorSettingsDraft,
  KafkaSaslMechanism,
  KafkaSecurityProtocol,
} from './types';

type SerializeResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; field: string; message: string };

const DEFAULT_KAFKA_PROTOCOL: KafkaSecurityProtocol = 'PLAINTEXT';
const DEFAULT_KAFKA_MECHANISM: KafkaSaslMechanism = 'PLAIN';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asScalarString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toLines(values: string[]): string {
  return values.join('\n');
}

function fromLines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function trimOptional(input: string): string | undefined {
  const trimmed = input.trim();
  return trimmed ? trimmed : undefined;
}

function parsePositiveFloat(input: string, field: string, label: string): SerializeResult | number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { ok: false, field, message: `${label} must be a number greater than 0.` };
  }
  return parsed;
}

function parsePositiveInt(input: string, field: string, label: string): SerializeResult | number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { ok: false, field, message: `${label} must be an integer greater than 0.` };
  }
  return parsed;
}

function createSqlReaderSettingsDraft(): ConnectorSettingsDraft {
  return {
    kind: 'sql_reader',
    values: {
      database_url: '',
      allowed_tables_text: '',
      enable_sql_text_tool: false,
      timeout_seconds: '30',
      source: 'sql_reader',
    },
  };
}

function createMilvusSettingsDraft(): ConnectorSettingsDraft {
  return {
    kind: 'milvus',
    values: {
      uri: '',
      collections_text: '',
      database: 'default',
      timeout_seconds: '30',
      token: '',
      source: 'milvus',
    },
  };
}

function createKafkaSettingsDraft(): ConnectorSettingsDraft {
  return {
    kind: 'kafka',
    values: {
      bootstrap_servers_text: '',
      allowed_topics_text: '',
      security_protocol: DEFAULT_KAFKA_PROTOCOL,
      ssl_cafile: '',
      sasl_mechanism: DEFAULT_KAFKA_MECHANISM,
      sasl_username: '',
      sasl_password: '',
      client_id: 'dataclaw',
      group_id: '',
      request_timeout_ms: '30000',
      source: 'kafka',
    },
  };
}

export function createDefaultSettingsDraft(kind: ConnectorKind): ConnectorSettingsDraft {
  switch (kind) {
    case 'sql_reader':
      return createSqlReaderSettingsDraft();
    case 'milvus':
      return createMilvusSettingsDraft();
    case 'kafka':
      return createKafkaSettingsDraft();
  }
}

export function createDefaultConnectorFormDraft(): ConnectorFormDraft {
  return {
    id: '',
    kind: 'sql_reader',
    enabled: true,
    settings: createDefaultSettingsDraft('sql_reader'),
  };
}

export function connectorToFormDraft(connector: ConnectorDraft): ConnectorFormDraft {
  const settings = connector.settings;
  if (connector.kind === 'sql_reader') {
    return {
      id: connector.id,
      kind: connector.kind,
      enabled: connector.enabled,
      settings: {
        kind: 'sql_reader',
        values: {
          database_url: asString(settings.database_url),
          allowed_tables_text: toLines(asStringArray(settings.allowed_tables)),
          enable_sql_text_tool: asBoolean(settings.enable_sql_text_tool, false),
          timeout_seconds:
            settings.timeout_seconds === undefined || settings.timeout_seconds === null
              ? ''
              : asScalarString(settings.timeout_seconds),
          source: asString(settings.source),
        },
      },
    };
  }

  if (connector.kind === 'milvus') {
    return {
      id: connector.id,
      kind: connector.kind,
      enabled: connector.enabled,
      settings: {
        kind: 'milvus',
        values: {
          uri: asString(settings.uri),
          collections_text: toLines(asStringArray(settings.collections)),
          database: asString(settings.database),
          timeout_seconds:
            settings.timeout_seconds === undefined || settings.timeout_seconds === null
              ? ''
              : asScalarString(settings.timeout_seconds),
          token: asString(settings.token),
          source: asString(settings.source),
        },
      },
    };
  }

  const protocolRaw = asString(settings.security_protocol).toUpperCase();
  const protocol = (['PLAINTEXT', 'SASL_PLAINTEXT', 'SSL', 'SASL_SSL'] as const).includes(
    protocolRaw as KafkaSecurityProtocol,
  )
    ? (protocolRaw as KafkaSecurityProtocol)
    : DEFAULT_KAFKA_PROTOCOL;
  const mechanismRaw = asString(settings.sasl_mechanism).toUpperCase();
  const mechanism = (['PLAIN', 'SCRAM-SHA-256', 'SCRAM-SHA-512'] as const).includes(
    mechanismRaw as KafkaSaslMechanism,
  )
    ? (mechanismRaw as KafkaSaslMechanism)
    : DEFAULT_KAFKA_MECHANISM;

  return {
    id: connector.id,
    kind: connector.kind,
    enabled: connector.enabled,
    settings: {
      kind: 'kafka',
      values: {
        bootstrap_servers_text: toLines(asStringArray(settings.bootstrap_servers)),
        allowed_topics_text: toLines(asStringArray(settings.allowed_topics)),
        security_protocol: protocol,
        ssl_cafile: asString(settings.ssl_cafile),
        sasl_mechanism: mechanism,
        sasl_username: asString(settings.sasl_username),
        sasl_password: asString(settings.sasl_password),
        client_id: asString(settings.client_id),
        group_id: asString(settings.group_id),
        request_timeout_ms:
          settings.request_timeout_ms === undefined || settings.request_timeout_ms === null
            ? ''
            : asScalarString(settings.request_timeout_ms),
        source: asString(settings.source),
      },
    },
  };
}

export function switchSettingsDraftKind(prev: ConnectorFormDraft, nextKind: ConnectorKind): ConnectorFormDraft {
  if (prev.kind === nextKind && prev.settings.kind === nextKind) {
    return prev;
  }
  return {
    ...prev,
    kind: nextKind,
    settings: createDefaultSettingsDraft(nextKind),
  };
}

export function serializeSettingsDraft(settingsDraft: ConnectorSettingsDraft): SerializeResult {
  if (settingsDraft.kind === 'sql_reader') {
    const v = settingsDraft.values;
    const databaseUrl = v.database_url.trim();
    if (!databaseUrl) return { ok: false, field: 'settings.database_url', message: 'Database URL is required.' };
    const allowedTables = fromLines(v.allowed_tables_text);
    if (!allowedTables.length) {
      return { ok: false, field: 'settings.allowed_tables', message: 'At least one allowed table is required.' };
    }
    const timeoutSeconds = parsePositiveFloat(v.timeout_seconds, 'settings.timeout_seconds', 'Timeout seconds');
    if (typeof timeoutSeconds === 'object' && timeoutSeconds && 'ok' in timeoutSeconds && !timeoutSeconds.ok) {
      return timeoutSeconds;
    }

    const payload: Record<string, unknown> = {
      database_url: databaseUrl,
      allowed_tables: allowedTables,
      enable_sql_text_tool: v.enable_sql_text_tool,
    };
    if (typeof timeoutSeconds === 'number') payload.timeout_seconds = timeoutSeconds;
    const source = trimOptional(v.source);
    if (source) payload.source = source;
    return { ok: true, value: payload };
  }

  if (settingsDraft.kind === 'milvus') {
    const v = settingsDraft.values;
    const uri = v.uri.trim();
    if (!uri) return { ok: false, field: 'settings.uri', message: 'Milvus URI is required.' };
    const collections = fromLines(v.collections_text);
    if (!collections.length) {
      return { ok: false, field: 'settings.collections', message: 'At least one collection is required.' };
    }
    const timeoutSeconds = parsePositiveFloat(v.timeout_seconds, 'settings.timeout_seconds', 'Timeout seconds');
    if (typeof timeoutSeconds === 'object' && timeoutSeconds && 'ok' in timeoutSeconds && !timeoutSeconds.ok) {
      return timeoutSeconds;
    }

    const payload: Record<string, unknown> = {
      uri,
      collections,
    };
    const database = trimOptional(v.database);
    if (database) payload.database = database;
    if (typeof timeoutSeconds === 'number') payload.timeout_seconds = timeoutSeconds;
    const token = trimOptional(v.token);
    if (token) payload.token = token;
    const source = trimOptional(v.source);
    if (source) payload.source = source;
    return { ok: true, value: payload };
  }

  const v = settingsDraft.values;
  const bootstrapServers = fromLines(v.bootstrap_servers_text);
  if (!bootstrapServers.length) {
    return { ok: false, field: 'settings.bootstrap_servers', message: 'At least one bootstrap server is required.' };
  }
  const allowedTopics = fromLines(v.allowed_topics_text);
  if (!allowedTopics.length) {
    return { ok: false, field: 'settings.allowed_topics', message: 'At least one allowed topic is required.' };
  }
  const requestTimeoutMs = parsePositiveInt(v.request_timeout_ms, 'settings.request_timeout_ms', 'Request timeout (ms)');
  if (typeof requestTimeoutMs === 'object' && requestTimeoutMs && 'ok' in requestTimeoutMs && !requestTimeoutMs.ok) {
    return requestTimeoutMs;
  }

  const payload: Record<string, unknown> = {
    bootstrap_servers: bootstrapServers,
    allowed_topics: allowedTopics,
    security_protocol: v.security_protocol,
  };
  const clientId = trimOptional(v.client_id);
  if (clientId) payload.client_id = clientId;
  const groupId = trimOptional(v.group_id);
  if (groupId) payload.group_id = groupId;
  if (typeof requestTimeoutMs === 'number') payload.request_timeout_ms = requestTimeoutMs;
  const source = trimOptional(v.source);
  if (source) payload.source = source;

  const needsSasl = v.security_protocol === 'SASL_PLAINTEXT' || v.security_protocol === 'SASL_SSL';
  const needsSslCafile = v.security_protocol === 'SSL' || v.security_protocol === 'SASL_SSL';

  if (needsSasl) {
    const username = v.sasl_username.trim();
    const password = v.sasl_password.trim();
    if (!username) return { ok: false, field: 'settings.sasl_username', message: 'SASL username is required.' };
    if (!password) return { ok: false, field: 'settings.sasl_password', message: 'SASL password is required.' };
    payload.sasl_mechanism = v.sasl_mechanism;
    payload.sasl_username = username;
    payload.sasl_password = password;
  }

  if (needsSslCafile) {
    const sslCafile = v.ssl_cafile.trim();
    if (!sslCafile) return { ok: false, field: 'settings.ssl_cafile', message: 'SSL CA file path is required.' };
    payload.ssl_cafile = sslCafile;
  }

  return { ok: true, value: payload };
}
