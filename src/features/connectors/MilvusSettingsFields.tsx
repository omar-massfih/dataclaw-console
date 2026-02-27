import { FormSectionHeader, InfoTooltip, Input, Stack, Text } from '../../components/primitives';
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
      <FormSectionHeader
        title="Milvus"
        tooltip="Use this to connect to Milvus and limit search to selected collections."
      />
      <Input
        label="Milvus URI"
        infoTooltip="Use this to set the Milvus endpoint URI. Required."
        value={settings.uri}
        onChange={(event) => onChange('uri', event.target.value)}
        disabled={disabled}
        error={getError(fieldError, 'settings.uri')}
        placeholder="http://localhost:19530"
      />

      <label className="field-label">
        <span className="field-label__row">
          <span className="field-label__title">Collections (one per line)</span>
          <InfoTooltip
            label="About Collections"
            content="Use this to list searchable collections. Required. Use names like collection or namespace.collection."
          />
        </span>
        <textarea
          className="field-input connectors-form-json"
          aria-label="Collections (one per line)"
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
        infoTooltip="Use this to choose a Milvus database namespace. Optional."
        value={settings.database}
        onChange={(event) => onChange('database', event.target.value)}
        disabled={disabled}
        placeholder="default"
      />

      <Input
        label="Token (optional)"
        infoTooltip="Use this to provide a Milvus auth token. Optional."
        type="password"
        value={settings.token}
        onChange={(event) => onChange('token', event.target.value)}
        disabled={disabled}
        placeholder="Milvus auth token"
      />

      <Input
        label="Timeout seconds (optional)"
        infoTooltip="Use this to set request timeout in seconds. Optional. Must be greater than 0."
        value={settings.timeout_seconds}
        onChange={(event) => onChange('timeout_seconds', event.target.value)}
        disabled={disabled}
        error={getError(fieldError, 'settings.timeout_seconds')}
        inputMode="decimal"
        placeholder="30"
      />

      <Text variant="small" tone="muted">
        Use token only when your Milvus endpoint requires authentication.
      </Text>
    </Stack>
  );
}
