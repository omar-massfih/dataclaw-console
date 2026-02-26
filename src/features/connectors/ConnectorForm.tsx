import { FormPageLayout } from '../../components/layouts';
import { Button, Inline, Input, Stack, Surface, Text } from '../../components/primitives';
import { ConnectorJsonEditor } from './ConnectorJsonEditor';
import type { ConnectorFormDraft, EditorMode } from './types';

interface ConnectorFormProps {
  mode: Extract<EditorMode, 'create' | 'edit'>;
  draft: ConnectorFormDraft;
  isSaving: boolean;
  formError: string | null;
  jsonParseError: string | null;
  onChange: <K extends keyof ConnectorFormDraft>(field: K, value: ConnectorFormDraft[K]) => void;
  onKindChange: (kind: ConnectorFormDraft['kind']) => void;
  onResetSettingsTemplate: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ConnectorForm({
  mode,
  draft,
  isSaving,
  formError,
  jsonParseError,
  onChange,
  onKindChange,
  onResetSettingsTemplate,
  onSave,
  onCancel,
}: ConnectorFormProps) {
  const title = mode === 'create' ? 'Create connector' : `Edit connector: ${draft.id}`;

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
            >
              <option value="sql_reader">sql_reader</option>
              <option value="milvus">milvus</option>
              <option value="kafka">kafka</option>
            </select>
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
          <Inline justify="between" align="center" wrap gap={12}>
            <Text as="h3" variant="h3" weight="bold">
              Settings
            </Text>
            <Button type="button" variant="secondary" onClick={onResetSettingsTemplate} disabled={isSaving}>
              Reset to {draft.kind} template
            </Button>
          </Inline>
          <ConnectorJsonEditor
            value={draft.settingsText}
            onChange={(value) => onChange('settingsText', value)}
            error={jsonParseError}
            disabled={isSaving}
          />
        </Stack>
      </Surface>

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
        {mode === 'edit' ? 'Connector ID is locked in edit mode.' : 'Create a new connector draft.'}
      </Text>
      <Inline gap={12}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={onSave} isLoading={isSaving}>
          Save
        </Button>
      </Inline>
    </Inline>
  );

  return (
    <FormPageLayout
      className="connectors-detail"
      title={title}
      description="Connector drafts are stored in SQLite and validated against backend connector schema rules."
      sections={sections}
      actions={actions}
    />
  );
}
