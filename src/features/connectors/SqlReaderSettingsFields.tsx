import { Input, Stack, Text } from '../../components/primitives';
import type { ConnectorFormFieldError, SqlReaderSettingsDraft } from './types';

interface SqlReaderSettingsFieldsProps {
  settings: SqlReaderSettingsDraft;
  disabled: boolean;
  fieldError: ConnectorFormFieldError | null;
  onChange: (field: keyof SqlReaderSettingsDraft, value: string | boolean) => void;
}

function isFieldError(fieldError: ConnectorFormFieldError | null, field: string): string | undefined {
  return fieldError?.field === field ? fieldError.message : undefined;
}

export function SqlReaderSettingsFields({ settings, disabled, fieldError, onChange }: SqlReaderSettingsFieldsProps) {
  return (
    <Stack gap={12}>
      <Input
        label="Database URL"
        value={settings.database_url}
        onChange={(event) => onChange('database_url', event.target.value)}
        disabled={disabled}
        error={isFieldError(fieldError, 'settings.database_url')}
        placeholder="sqlite:///tmp.db"
      />

      <label className="field-label">
        Allowed tables (one per line)
        <textarea
          className="field-input connectors-form-json"
          rows={6}
          value={settings.allowed_tables_text}
          onChange={(event) => onChange('allowed_tables_text', event.target.value)}
          disabled={disabled}
          aria-invalid={isFieldError(fieldError, 'settings.allowed_tables') ? 'true' : undefined}
          spellCheck={false}
        />
        <span className="field-hint">Example: `orders` or `public.orders`</span>
        {isFieldError(fieldError, 'settings.allowed_tables') ? (
          <span className="field-error">{isFieldError(fieldError, 'settings.allowed_tables')}</span>
        ) : null}
      </label>

      <label className="field-checkbox">
        <input
          type="checkbox"
          checked={settings.enable_sql_text_tool}
          onChange={(event) => onChange('enable_sql_text_tool', event.target.checked)}
          disabled={disabled}
        />
        <span>Enable SQL text tool</span>
      </label>

      <Input
        label="Timeout seconds (optional)"
        value={settings.timeout_seconds}
        onChange={(event) => onChange('timeout_seconds', event.target.value)}
        disabled={disabled}
        error={isFieldError(fieldError, 'settings.timeout_seconds')}
        inputMode="decimal"
        placeholder="30"
      />

      <Input
        label="Source (optional)"
        value={settings.source}
        onChange={(event) => onChange('source', event.target.value)}
        disabled={disabled}
        placeholder="sql_reader"
      />

      <Text variant="small" tone="muted">
        Backend still validates identifier formats and connector-specific constraints.
      </Text>
    </Stack>
  );
}
