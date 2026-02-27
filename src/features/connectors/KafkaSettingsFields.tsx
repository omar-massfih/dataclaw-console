import { useState } from 'react';

import { Button, Input, Stack, Text } from '../../components/primitives';
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
  mode,
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
  const canUseTlsProtocols = mode === 'edit' && Boolean(connectorId);
  const canUpload = canUseTlsProtocols && Boolean(connectorId);
  const bootstrapError = getError(fieldError, 'settings.bootstrap_servers');
  const topicsError = getError(fieldError, 'settings.allowed_topics');
  const sslCafileError = getError(fieldError, 'settings.ssl_cafile');

  async function handleUpload() {
    if (!selectedUploadFile || !canUpload) return;
    const result = await onUploadSslCafile(selectedUploadFile);
    if (result.ok) {
      setSelectedUploadFile(null);
    }
  }

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
          <option value="SSL" disabled={!canUseTlsProtocols}>
            SSL
          </option>
          <option value="SASL_SSL" disabled={!canUseTlsProtocols}>
            SASL_SSL
          </option>
        </select>
        <span className="field-hint">SASL and SSL fields are shown only when required by the selected protocol.</span>
        {!canUseTlsProtocols ? (
          <span className="field-hint">Save connector first to enable SSL/SASL_SSL and upload CA cert.</span>
        ) : null}
      </label>

      {needsSslCafile ? (
        <Stack gap={8}>
          <label className="field-label">
            SSL CA certificate (.pem or .crt)
            <input
              className="field-input"
              type="file"
              accept=".pem,.crt"
              disabled={disabled || !canUpload}
              onChange={(event) => setSelectedUploadFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || !selectedUploadFile || !canUpload}
            onClick={() => void handleUpload()}
          >
            Upload certificate
          </Button>
          {!canUpload ? (
            <Text variant="small" tone="muted">
              Save this connector first, then upload the CA certificate.
            </Text>
          ) : null}
          {settings.ssl_cafile ? (
            <Text variant="small" tone="muted">
              Current CA file: {settings.ssl_cafile}
            </Text>
          ) : null}
          {sslUploadInfo ? (
            <Text variant="small" tone="muted">
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
