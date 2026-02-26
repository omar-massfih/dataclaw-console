import { KafkaSettingsFields } from './KafkaSettingsFields';
import { MilvusSettingsFields } from './MilvusSettingsFields';
import { SqlReaderSettingsFields } from './SqlReaderSettingsFields';
import type { ConnectorFormFieldError, ConnectorSettingsDraft } from './types';

interface ConnectorSettingsFieldsProps {
  settings: ConnectorSettingsDraft;
  disabled: boolean;
  fieldError: ConnectorFormFieldError | null;
  onChange: (field: string, value: string | boolean) => void;
}

export function ConnectorSettingsFields({ settings, disabled, fieldError, onChange }: ConnectorSettingsFieldsProps) {
  if (settings.kind === 'sql_reader') {
    return (
      <SqlReaderSettingsFields settings={settings.values} disabled={disabled} fieldError={fieldError} onChange={onChange} />
    );
  }
  if (settings.kind === 'milvus') {
    return <MilvusSettingsFields settings={settings.values} disabled={disabled} fieldError={fieldError} onChange={onChange} />;
  }
  return <KafkaSettingsFields settings={settings.values} disabled={disabled} fieldError={fieldError} onChange={onChange} />;
}
