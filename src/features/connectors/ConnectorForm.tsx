import { FormPageLayout } from '../../components/layouts';
import { Button, FormSectionHeader, InfoTooltip, Inline, Input, Stack, Surface, Text } from '../../components/primitives';
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
  const settingsConnectorId = mode === 'create' ? draft.id.trim() || null : selectedConnectorId;
  const sections = (
    <>
      <Surface as="section">
        <Stack gap={12}>
          <FormSectionHeader
            title="Basics"
            tooltip="Use this to set connector identity and whether it runs. Connector ID and kind are locked after save."
          />
          <Input
            label="Connector ID"
            infoTooltip="Use this to name the connector in config and runtime. Required. You can't change it after save."
            value={draft.id}
            onChange={(event) => onChange('id', event.target.value)}
            disabled={mode === 'edit'}
            placeholder="sql_reader_local"
          />
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">Kind</span>
              <InfoTooltip
                label="About Kind"
                content="Use this to choose connector type (sql_reader, milvus, kafka). Required. You can't change it after save."
              />
            </span>
            <select
              className="field-input"
              aria-label="Kind"
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
              aria-label="Enabled"
              checked={draft.enabled}
              onChange={(event) => onChange('enabled', event.target.checked)}
            />
            <span>Enabled</span>
            <InfoTooltip
              label="About Enabled"
              content="Use this to turn the connector on or off at runtime. Optional."
            />
          </label>
        </Stack>
      </Surface>

      <Surface as="section">
        <Stack gap={12}>
          <FormSectionHeader
            title="Settings"
            tooltip="Use this to set connector-specific options. Invalid combinations are rejected on save."
          />
          <ConnectorSettingsFields
            mode={mode}
            connectorId={settingsConnectorId}
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
