import { describe, expect, it } from 'vitest';

import {
  CONNECTOR_SETTINGS_TEMPLATES,
  getConnectorSettingsTemplateText,
  isDefaultConnectorSettingsText,
} from './templates';

describe('connector settings templates', () => {
  it('provides a template for each connector kind', () => {
    expect(CONNECTOR_SETTINGS_TEMPLATES.sql_reader).toHaveProperty('database_url');
    expect(CONNECTOR_SETTINGS_TEMPLATES.milvus).toHaveProperty('uri');
    expect(CONNECTOR_SETTINGS_TEMPLATES.kafka).toHaveProperty('bootstrap_servers');
  });

  it('returns stable pretty-printed template text', () => {
    const kafka = getConnectorSettingsTemplateText('kafka');
    expect(kafka).toContain('"security_protocol": "PLAINTEXT"');
    expect(kafka.startsWith('{\n')).toBe(true);
  });

  it('detects untouched/default JSON text', () => {
    expect(isDefaultConnectorSettingsText('sql_reader', '')).toBe(true);
    expect(isDefaultConnectorSettingsText('sql_reader', '   ')).toBe(true);
    expect(isDefaultConnectorSettingsText('sql_reader', '{}')).toBe(true);
    expect(isDefaultConnectorSettingsText('sql_reader', getConnectorSettingsTemplateText('sql_reader'))).toBe(true);

    const minified = JSON.stringify(CONNECTOR_SETTINGS_TEMPLATES.sql_reader);
    expect(isDefaultConnectorSettingsText('sql_reader', minified)).toBe(true);
  });

  it('does not treat edited JSON as default', () => {
    expect(
      isDefaultConnectorSettingsText(
        'sql_reader',
        '{"database_url":"sqlite:///tmp.db","allowed_tables":["orders"],"enable_sql_text_tool":false,"timeout_seconds":30,"source":"sql_reader"}',
      ),
    ).toBe(false);
  });
});
