import { KafkaSettingsFields } from './KafkaSettingsFields';
import { MilvusSettingsFields } from './MilvusSettingsFields';
import { SqlReaderSettingsFields } from './SqlReaderSettingsFields';
import type {
  ConnectorFormFieldError,
  ConnectorSettingsDraft,
  EditorMode,
  UploadedSslCafilePayload,
} from './types';

interface ConnectorSettingsFieldsProps {
  mode: Extract<EditorMode, 'create' | 'edit'>;
  connectorId: string | null;
  settings: ConnectorSettingsDraft;
  disabled: boolean;
  fieldError: ConnectorFormFieldError | null;
  sslUploadError: string | null;
  sslUploadInfo: UploadedSslCafilePayload | null;
  onChange: (field: string, value: string | boolean) => void;
  onUploadSslCafile: (file: File) => Promise<{ ok: boolean }>;
}

export function ConnectorSettingsFields({
  mode,
  connectorId,
  settings,
  disabled,
  fieldError,
  sslUploadError,
  sslUploadInfo,
  onChange,
  onUploadSslCafile,
}: ConnectorSettingsFieldsProps) {
  if (settings.kind === 'sql_reader') {
    return (
      <SqlReaderSettingsFields settings={settings.values} disabled={disabled} fieldError={fieldError} onChange={onChange} />
    );
  }
  if (settings.kind === 'milvus') {
    return <MilvusSettingsFields settings={settings.values} disabled={disabled} fieldError={fieldError} onChange={onChange} />;
  }
  return (
    <KafkaSettingsFields
      mode={mode}
      connectorId={connectorId}
      settings={settings.values}
      disabled={disabled}
      fieldError={fieldError}
      sslUploadError={sslUploadError}
      sslUploadInfo={sslUploadInfo}
      onChange={onChange}
      onUploadSslCafile={onUploadSslCafile}
    />
  );
}
