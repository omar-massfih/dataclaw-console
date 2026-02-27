import { useState } from 'react';

import { Button, FormSectionHeader, InfoTooltip, Input, Stack, Text } from '../../components/primitives';
import type { ConnectorFormFieldError, EditorMode, KafkaSettingsDraft, UploadedSslCafilePayload } from './types';

interface KafkaSettingsFieldsProps {
  mode: Extract<EditorMode, 'create' | 'edit'>;
  connectorId: string | null;
  settings: KafkaSettingsDraft;
  disabled: boolean;
  fieldError: ConnectorFormFieldError | null;
  sslUploadError: string | null;
  sslUploadInfo: UploadedSslCafilePayload | null;
  onChange: (field: keyof KafkaSettingsDraft, value: string | boolean) => void;
  onUploadSslCafile: (file: File) => Promise<{ ok: boolean }>;
}

function getError(fieldError: ConnectorFormFieldError | null, field: string): string | undefined {
  return fieldError?.field === field ? fieldError.message : undefined;
}

export function KafkaSettingsFields({
  connectorId,
  settings,
  disabled,
  fieldError,
  sslUploadError,
  sslUploadInfo,
  onChange,
  onUploadSslCafile,
}: KafkaSettingsFieldsProps) {
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const needsSasl = settings.security_protocol === 'SASL_PLAINTEXT' || settings.security_protocol === 'SASL_SSL';
  const needsSslCafile = settings.security_protocol === 'SSL' || settings.security_protocol === 'SASL_SSL';
  const bootstrapError = getError(fieldError, 'settings.bootstrap_servers');
  const topicsError = getError(fieldError, 'settings.allowed_topics');
  const sslCafileError = getError(fieldError, 'settings.ssl_cafile');
  const hasConnectorId = Boolean(connectorId?.trim());

  async function handleUpload() {
    if (!selectedUploadFile) return;
    const result = await onUploadSslCafile(selectedUploadFile);
    if (result.ok) {
      setSelectedUploadFile(null);
    }
  }

  return (
    <Stack gap={12}>
      <FormSectionHeader
        title="Kafka"
        tooltip="Use this to connect to Kafka brokers and topics. Required fields depend on the security protocol."
      />
      <label className="field-label">
        <span className="field-label__row">
          <span className="field-label__title">Bootstrap servers (one `host:port` per line)</span>
          <InfoTooltip
            label="About Bootstrap servers"
            content="Use this to list seed brokers as host:port, one per line. Required."
          />
        </span>
        <textarea
          className="field-input connectors-form-json"
          aria-label="Bootstrap servers (one host:port per line)"
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
        <span className="field-label__row">
          <span className="field-label__title">Allowed topics (one per line)</span>
          <InfoTooltip
            label="About Allowed topics"
            content="Use this to limit which topics this connector can read. Required."
          />
        </span>
        <textarea
          className="field-input connectors-form-json"
          aria-label="Allowed topics (one per line)"
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
        <span className="field-label__row">
          <span className="field-label__title">Security protocol</span>
          <InfoTooltip
            label="About Security protocol"
            content="Use this to choose how Kafka connects. This decides which SASL and SSL fields are required."
          />
        </span>
        <select
          className="field-input"
          aria-label="Security protocol"
          value={settings.security_protocol}
          onChange={(event) => onChange('security_protocol', event.target.value)}
          disabled={disabled}
          aria-invalid={getError(fieldError, 'settings.security_protocol') ? 'true' : undefined}
        >
          <option value="PLAINTEXT">PLAINTEXT</option>
          <option value="SASL_PLAINTEXT">SASL_PLAINTEXT</option>
          <option value="SSL">
            SSL
          </option>
          <option value="SASL_SSL">
            SASL_SSL
          </option>
        </select>
        <span className="field-hint">Use this to choose connection mode. SASL and SSL fields show only when needed.</span>
      </label>

      <Stack gap={8}>
        <label className="field-label">
          <span className="field-label__row">
            <span className="field-label__title">SSL CA certificate (.pem or .crt)</span>
            <InfoTooltip
              label="About SSL CA certificate"
              content="Use this to upload the CA certificate file. Required only when saving with SSL or SASL_SSL."
            />
          </span>
          <input
            className="field-input"
            aria-label="SSL CA certificate (.pem or .crt)"
            type="file"
            accept=".pem,.crt"
            disabled={disabled}
            onChange={(event) => setSelectedUploadFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !selectedUploadFile || !hasConnectorId}
          onClick={() => void handleUpload()}
        >
          Upload certificate
        </Button>
        {!hasConnectorId ? (
          <Text variant="small" tone="muted">
            Enter Connector ID first, then upload the certificate.
          </Text>
        ) : null}
        {!needsSslCafile ? (
          <Text variant="small" tone="muted">
            Upload stores certificate path in this draft. PLAINTEXT does not use it until you switch to SSL/SASL_SSL.
          </Text>
        ) : null}
        {settings.ssl_cafile ? (
          <Text variant="small" tone="muted" className="connectors-path-break">
            Current CA file: {settings.ssl_cafile}
          </Text>
        ) : null}
        {sslUploadInfo ? (
          <Text variant="small" tone="muted" className="connectors-path-break">
            Uploaded: {sslUploadInfo.path} ({sslUploadInfo.size_bytes} bytes, sha256 {sslUploadInfo.sha256.slice(0, 12)}...)
          </Text>
        ) : null}
        {sslUploadError ? (
          <span className="field-error">{sslUploadError}</span>
        ) : null}
        {sslCafileError ? (
          <span className="field-error">{sslCafileError}</span>
        ) : null}
      </Stack>

      {needsSasl ? (
        <>
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">SASL mechanism</span>
              <InfoTooltip
                label="About SASL mechanism"
                content="Use this to choose the SASL auth mechanism. Required for SASL protocols."
              />
            </span>
            <select
              className="field-input"
              aria-label="SASL mechanism"
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
            infoTooltip="Use this to set SASL username. Required for SASL protocols."
            value={settings.sasl_username}
            onChange={(event) => onChange('sasl_username', event.target.value)}
            disabled={disabled}
            error={getError(fieldError, 'settings.sasl_username')}
          />

          <Input
            label="SASL password"
            infoTooltip="Use this to set SASL password. Required for SASL protocols."
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
        infoTooltip="Use this to set Kafka client ID. Optional."
        value={settings.client_id}
        onChange={(event) => onChange('client_id', event.target.value)}
        disabled={disabled}
        placeholder="dataclaw"
      />

      <Input
        label="Group ID (optional)"
        infoTooltip="Use this to set consumer group ID. Optional."
        value={settings.group_id}
        onChange={(event) => onChange('group_id', event.target.value)}
        disabled={disabled}
      />

      <Input
        label="Request timeout (ms) (optional)"
        infoTooltip="Use this to set request timeout in milliseconds. Optional. Must be greater than 0."
        value={settings.request_timeout_ms}
        onChange={(event) => onChange('request_timeout_ms', event.target.value)}
        disabled={disabled}
        error={getError(fieldError, 'settings.request_timeout_ms')}
        inputMode="numeric"
        placeholder="30000"
      />

      <Text variant="small" tone="muted">
        Use this form to set all options. Fields hidden by protocol are not sent on save.
      </Text>
    </Stack>
  );
}
