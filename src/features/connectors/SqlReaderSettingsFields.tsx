import { FormSectionHeader, InfoTooltip, Input, Stack, Text } from '../../components/primitives';
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
      <FormSectionHeader
        title="SQL Reader"
        tooltip="Use this to connect to a SQL database and limit access to specific tables."
      />
      <Input
        label="Database URL"
        infoTooltip="Use this to set the SQL connection string. Required."
        value={settings.database_url}
        onChange={(event) => onChange('database_url', event.target.value)}
        disabled={disabled}
        error={isFieldError(fieldError, 'settings.database_url')}
        placeholder="sqlite:///tmp.db"
      />

      <label className="field-label">
        <span className="field-label__row">
          <span className="field-label__title">Allowed tables (one per line)</span>
          <InfoTooltip
            label="About Allowed tables"
            content="Use this to list tables this connector can read. Required. Use names like table or schema.table."
          />
        </span>
        <textarea
          className="field-input connectors-form-json"
          aria-label="Allowed tables (one per line)"
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
          aria-label="Enable SQL text tool"
          checked={settings.enable_sql_text_tool}
          onChange={(event) => onChange('enable_sql_text_tool', event.target.checked)}
          disabled={disabled}
        />
        <span>Enable SQL text tool</span>
        <InfoTooltip
          label="About Enable SQL text tool"
          content="Use this to allow direct SQL text queries for this connector. Optional."
        />
      </label>

      <Input
        label="Timeout seconds (optional)"
        infoTooltip="Use this to set request timeout in seconds. Optional. Must be greater than 0."
        value={settings.timeout_seconds}
        onChange={(event) => onChange('timeout_seconds', event.target.value)}
        disabled={disabled}
        error={isFieldError(fieldError, 'settings.timeout_seconds')}
        inputMode="decimal"
        placeholder="30"
      />

      <Text variant="small" tone="muted">
        Use valid table names. Save will fail if a table name format is invalid.
      </Text>
    </Stack>
  );
}
