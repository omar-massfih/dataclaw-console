import { describe, expect, it } from 'vitest';

import {
  connectorToFormDraft,
  createDefaultConnectorFormDraft,
  createDefaultSettingsDraft,
  serializeSettingsDraft,
} from './form-mappers';
import type { ConnectorDraft } from './types';

describe('form-mappers', () => {
  it('creates defaults for all connector kinds', () => {
    const form = createDefaultConnectorFormDraft();
    expect(form.kind).toBe('sql_reader');
    expect(form.settings.kind).toBe('sql_reader');

    expect(createDefaultSettingsDraft('milvus').kind).toBe('milvus');
    const kafka = createDefaultSettingsDraft('kafka');
    expect(kafka.kind).toBe('kafka');
    if (kafka.kind === 'kafka') {
      expect(kafka.values.security_protocol).toBe('PLAINTEXT');
    }
  });

  it('maps connector payload into form draft', () => {
    const connector: ConnectorDraft = {
      id: 'kafka_demo',
      kind: 'kafka',
      enabled: true,
      settings: {
        bootstrap_servers: ['localhost:9092', 'localhost:9093'],
        allowed_topics: ['ships', 'ports'],
        security_protocol: 'SASL_SSL',
        ssl_cafile: '/tmp/ca.pem',
        sasl_mechanism: 'PLAIN',
        sasl_username: 'user',
        client_id: 'dataclaw',
        request_timeout_ms: 1000,
      },
      created_at: '2026-02-26T00:00:00Z',
      updated_at: '2026-02-26T00:00:00Z',
    };

    const formDraft = connectorToFormDraft(connector);
    expect(formDraft.kind).toBe('kafka');
    expect(formDraft.settings.kind).toBe('kafka');
    if (formDraft.settings.kind === 'kafka') {
      expect(formDraft.settings.values.bootstrap_servers_text).toContain('localhost:9092');
      expect(formDraft.settings.values.allowed_topics_text).toContain('ships');
      expect(formDraft.settings.values.security_protocol).toBe('SASL_SSL');
      expect(formDraft.settings.values.ssl_cafile).toBe('/tmp/ca.pem');
    }
  });

  it('serializes sql_reader and omits empty optional fields', () => {
    const result = serializeSettingsDraft({
      kind: 'sql_reader',
      values: {
        database_url: ' sqlite:///tmp.db ',
        allowed_tables_text: 'orders\npublic.shipments\n',
        enable_sql_text_tool: false,
        timeout_seconds: '',
        source: '',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        database_url: 'sqlite:///tmp.db',
        allowed_tables: ['orders', 'public.shipments'],
        enable_sql_text_tool: false,
      });
    }
  });

  it('serializes kafka with progressive protocol fields', () => {
    const result = serializeSettingsDraft({
      kind: 'kafka',
      values: {
        bootstrap_servers_text: 'localhost:9092',
        allowed_topics_text: 'ship_events',
        security_protocol: 'SSL',
        ssl_cafile: '/tmp/ca.pem',
        sasl_mechanism: 'PLAIN',
        sasl_username: 'ignored',
        sasl_password: 'ignored',
        client_id: 'dataclaw',
        group_id: '',
        request_timeout_ms: '30000',
        source: 'kafka',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.security_protocol).toBe('SSL');
      expect(result.value).toHaveProperty('ssl_cafile', '/tmp/ca.pem');
      expect(result.value).not.toHaveProperty('sasl_username');
    }
  });

  it('returns client-side field errors for invalid settings', () => {
    const sql = serializeSettingsDraft({
      kind: 'sql_reader',
      values: {
        database_url: '',
        allowed_tables_text: '',
        enable_sql_text_tool: false,
        timeout_seconds: '',
        source: '',
      },
    });
    expect(sql.ok).toBe(false);
    if (!sql.ok) expect(sql.field).toBe('settings.database_url');

    const kafka = serializeSettingsDraft({
      kind: 'kafka',
      values: {
        bootstrap_servers_text: 'localhost:9092',
        allowed_topics_text: 'ship_events',
        security_protocol: 'SASL_SSL',
        ssl_cafile: '',
        sasl_mechanism: 'PLAIN',
        sasl_username: '',
        sasl_password: '',
        client_id: '',
        group_id: '',
        request_timeout_ms: '',
        source: '',
      },
    });
    expect(kafka.ok).toBe(false);
  });
});
