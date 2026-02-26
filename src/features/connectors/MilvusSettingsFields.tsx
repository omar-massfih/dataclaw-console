import { Input, Stack, Text } from '../../components/primitives';
import type { ConnectorFormFieldError, MilvusSettingsDraft } from './types';

interface MilvusSettingsFieldsProps {
  settings: MilvusSettingsDraft;
  disabled: boolean;
  fieldError: ConnectorFormFieldError | null;
  onChange: (field: keyof MilvusSettingsDraft, value: string | boolean) => void;
}

function getError(fieldError: ConnectorFormFieldError | null, field: string): string | undefined {
  return fieldError?.field === field ? fieldError.message : undefined;
}

export function MilvusSettingsFields({ settings, disabled, fieldError, onChange }: MilvusSettingsFieldsProps) {
  const collectionsError = getError(fieldError, 'settings.collections');

  return (
    <Stack gap={12}>
      <Input
        label="Milvus URI"
        value={settings.uri}
        onChange={(event) => onChange('uri', event.target.value)}
        disabled={disabled}
        error={getError(fieldError, 'settings.uri')}
        placeholder="http://localhost:19530"
      />

      <label className="field-label">
        Collections (one per line)
        <textarea
          className="field-input connectors-form-json"
          rows={6}
          value={settings.collections_text}
          onChange={(event) => onChange('collections_text', event.target.value)}
          disabled={disabled}
          aria-invalid={collectionsError ? 'true' : undefined}
          spellCheck={false}
        />
        <span className="field-hint">Example: `ships` or `namespace.ships`</span>
        {collectionsError ? <span className="field-error">{collectionsError}</span> : null}
      </label>

      <Input
        label="Database (optional)"
        value={settings.database}
        onChange={(event) => onChange('database', event.target.value)}
        disabled={disabled}
        placeholder="default"
      />

      <Input
        label="Token (optional)"
        type="password"
        value={settings.token}
        onChange={(event) => onChange('token', event.target.value)}
        disabled={disabled}
        placeholder="Milvus auth token"
      />

      <Input
        label="Timeout seconds (optional)"
        value={settings.timeout_seconds}
        onChange={(event) => onChange('timeout_seconds', event.target.value)}
        disabled={disabled}
        error={getError(fieldError, 'settings.timeout_seconds')}
        inputMode="decimal"
        placeholder="30"
      />

      <Input
        label="Source (optional)"
        value={settings.source}
        onChange={(event) => onChange('source', event.target.value)}
        disabled={disabled}
        placeholder="milvus"
      />

      <Text variant="small" tone="muted">
        Optional token is only sent when provided.
      </Text>
    </Stack>
  );
}
