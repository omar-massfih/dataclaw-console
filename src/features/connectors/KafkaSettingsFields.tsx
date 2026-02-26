import { Input, Stack, Text } from '../../components/primitives';
import type { ConnectorFormFieldError, KafkaSettingsDraft } from './types';

interface KafkaSettingsFieldsProps {
  settings: KafkaSettingsDraft;
  disabled: boolean;
  fieldError: ConnectorFormFieldError | null;
  onChange: (field: keyof KafkaSettingsDraft, value: string | boolean) => void;
}

function getError(fieldError: ConnectorFormFieldError | null, field: string): string | undefined {
  return fieldError?.field === field ? fieldError.message : undefined;
}

export function KafkaSettingsFields({ settings, disabled, fieldError, onChange }: KafkaSettingsFieldsProps) {
  const needsSasl = settings.security_protocol === 'SASL_PLAINTEXT' || settings.security_protocol === 'SASL_SSL';
  const needsSslCafile = settings.security_protocol === 'SSL' || settings.security_protocol === 'SASL_SSL';
  const bootstrapError = getError(fieldError, 'settings.bootstrap_servers');
  const topicsError = getError(fieldError, 'settings.allowed_topics');

  return (
    <Stack gap={12}>
      <label className="field-label">
        Bootstrap servers (one `host:port` per line)
        <textarea
          className="field-input connectors-form-json"
          rows={5}
          value={settings.bootstrap_servers_text}
          onChange={(event) => onChange('bootstrap_servers_text', event.target.value)}
          disabled={disabled}
          aria-invalid={bootstrapError ? 'true' : undefined}
          spellCheck={false}
        />
        {bootstrapError ? <span className="field-error">{bootstrapError}</span> : null}
      </label>

      <label className="field-label">
        Allowed topics (one per line)
        <textarea
          className="field-input connectors-form-json"
          rows={5}
          value={settings.allowed_topics_text}
          onChange={(event) => onChange('allowed_topics_text', event.target.value)}
          disabled={disabled}
          aria-invalid={topicsError ? 'true' : undefined}
          spellCheck={false}
        />
        {topicsError ? <span className="field-error">{topicsError}</span> : null}
      </label>

      <label className="field-label">
        Security protocol
        <select
          className="field-input"
          value={settings.security_protocol}
          onChange={(event) => onChange('security_protocol', event.target.value)}
          disabled={disabled}
          aria-invalid={getError(fieldError, 'settings.security_protocol') ? 'true' : undefined}
        >
          <option value="PLAINTEXT">PLAINTEXT</option>
          <option value="SASL_PLAINTEXT">SASL_PLAINTEXT</option>
          <option value="SSL">SSL</option>
          <option value="SASL_SSL">SASL_SSL</option>
        </select>
        <span className="field-hint">SASL and SSL fields are shown only when required by the selected protocol.</span>
      </label>

      {needsSslCafile ? (
        <Input
          label="SSL CA file path"
          value={settings.ssl_cafile}
          onChange={(event) => onChange('ssl_cafile', event.target.value)}
          disabled={disabled}
          error={getError(fieldError, 'settings.ssl_cafile')}
          placeholder="/path/to/ca.pem"
        />
      ) : null}

      {needsSasl ? (
        <>
          <label className="field-label">
            SASL mechanism
            <select
              className="field-input"
              value={settings.sasl_mechanism}
              onChange={(event) => onChange('sasl_mechanism', event.target.value)}
              disabled={disabled}
            >
              <option value="PLAIN">PLAIN</option>
              <option value="SCRAM-SHA-256">SCRAM-SHA-256</option>
              <option value="SCRAM-SHA-512">SCRAM-SHA-512</option>
            </select>
          </label>

          <Input
            label="SASL username"
            value={settings.sasl_username}
            onChange={(event) => onChange('sasl_username', event.target.value)}
            disabled={disabled}
            error={getError(fieldError, 'settings.sasl_username')}
          />

          <Input
            label="SASL password"
            type="password"
            value={settings.sasl_password}
            onChange={(event) => onChange('sasl_password', event.target.value)}
            disabled={disabled}
            error={getError(fieldError, 'settings.sasl_password')}
          />
        </>
      ) : null}

      <Input
        label="Client ID (optional)"
        value={settings.client_id}
        onChange={(event) => onChange('client_id', event.target.value)}
        disabled={disabled}
        placeholder="dataclaw"
      />

      <Input
        label="Group ID (optional)"
        value={settings.group_id}
        onChange={(event) => onChange('group_id', event.target.value)}
        disabled={disabled}
      />

      <Input
        label="Request timeout (ms) (optional)"
        value={settings.request_timeout_ms}
        onChange={(event) => onChange('request_timeout_ms', event.target.value)}
        disabled={disabled}
        error={getError(fieldError, 'settings.request_timeout_ms')}
        inputMode="numeric"
        placeholder="30000"
      />

      <Input
        label="Source (optional)"
        value={settings.source}
        onChange={(event) => onChange('source', event.target.value)}
        disabled={disabled}
        placeholder="kafka"
      />

      <Text variant="small" tone="muted">
        Hidden protocol-specific fields are omitted when saving.
      </Text>
    </Stack>
  );
}
