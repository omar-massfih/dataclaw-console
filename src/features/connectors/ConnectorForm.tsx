import { FormPageLayout } from '../../components/layouts';
import { Button, Inline, Input, Stack, Surface, Text } from '../../components/primitives';
import { ConnectorSettingsFields } from './ConnectorSettingsFields';
import type {
  ConnectorFormDraft,
  ConnectorFormFieldError,
  EditorMode,
  UploadedSslCafilePayload,
} from './types';

interface ConnectorFormProps {
  mode: Extract<EditorMode, 'create' | 'edit'>;
  draft: ConnectorFormDraft;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  selectedConnectorId: string | null;
  formError: string | null;
  formFieldError: ConnectorFormFieldError | null;
  sslUploadError: string | null;
  sslUploadInfo: UploadedSslCafilePayload | null;
  isUploadingSslCafile: boolean;
  onChange: <K extends keyof ConnectorFormDraft>(field: K, value: ConnectorFormDraft[K]) => void;
  onUpdateSettingsField: (field: string, value: string | boolean) => void;
  onKindChange: (kind: ConnectorFormDraft['kind']) => void;
  onUploadSslCafile: (file: File) => Promise<{ ok: boolean }>;
  onSave: () => void;
  onCancel: () => void;
}

export function ConnectorForm({
  mode,
  draft,
  isSaving,
  saveStatus,
  selectedConnectorId,
  formError,
  formFieldError,
  sslUploadError,
  sslUploadInfo,
  isUploadingSslCafile,
  onChange,
  onUpdateSettingsField,
  onKindChange,
  onUploadSslCafile,
  onSave,
  onCancel,
}: ConnectorFormProps) {
  const sections = (
    <>
      <Surface as="section">
        <Stack gap={12}>
          <Text as="h3" variant="h3" weight="bold">
            Basics
          </Text>
          <Input
            label="Connector ID"
            value={draft.id}
            onChange={(event) => onChange('id', event.target.value)}
            disabled={mode === 'edit'}
            placeholder="sql_reader_local"
          />
          <label className="field-label">
            Kind
            <select
              className="field-input"
              value={draft.kind}
              onChange={(event) => onKindChange(event.target.value as ConnectorFormDraft['kind'])}
              disabled={mode === 'edit'}
            >
              <option value="sql_reader">sql_reader</option>
              <option value="milvus">milvus</option>
              <option value="kafka">kafka</option>
            </select>
            {mode === 'edit' ? <span className="field-hint">Kind is locked in edit mode.</span> : null}
          </label>
          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) => onChange('enabled', event.target.checked)}
            />
            <span>Enabled</span>
          </label>
        </Stack>
      </Surface>

      <Surface as="section">
        <Stack gap={12}>
          <Text as="h3" variant="h3" weight="bold">
            Settings
          </Text>
          <ConnectorSettingsFields
            mode={mode}
            connectorId={selectedConnectorId}
            settings={draft.settings}
            disabled={isSaving || isUploadingSslCafile}
            fieldError={formFieldError}
            sslUploadError={sslUploadError}
            sslUploadInfo={sslUploadInfo}
            onChange={onUpdateSettingsField}
            onUploadSslCafile={onUploadSslCafile}
          />
        </Stack>
      </Surface>

      {formFieldError ? (
        <Surface as="section" className="connectors-error" padding={16}>
          <Text tone="danger" weight="bold">
            {formFieldError.message}
          </Text>
        </Surface>
      ) : null}

      {formError ? (
        <Surface as="section" className="connectors-error" padding={16}>
          <Text tone="danger" weight="bold">
            {formError}
          </Text>
        </Surface>
      ) : null}
    </>
  );

  const actions = (
    <Inline justify="between" align="center" wrap gap={12}>
      <Text variant="small" tone="muted">
        {mode === 'edit' ? 'Connector ID and kind are locked in edit mode.' : 'Create a new connector draft.'}
      </Text>
      <Inline gap={12}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={saveStatus === 'saved' ? 'success' : 'primary'}
          onClick={onSave}
          isLoading={isSaving}
        >
          {saveStatus === 'saved' ? 'Saved' : 'Save'}
        </Button>
      </Inline>
    </Inline>
  );

  return (
    <FormPageLayout
      className="connectors-detail"
      title=""
      description=""
      sections={sections}
      actions={actions}
    />
  );
}
