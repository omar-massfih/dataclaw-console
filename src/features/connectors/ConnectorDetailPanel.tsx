import { Button,Inline, Stack, Surface, Text } from '../../components/primitives';
import { ConnectorForm } from './ConnectorForm';
import type {
  ConnectorDraft,
  ConnectorFormDraft,
  ConnectorFormFieldError,
  EditorMode,
} from './types';

interface ConnectorDetailPanelProps {
  mode: EditorMode;
  selectedConnector: ConnectorDraft | null;
  draft: ConnectorFormDraft;
  formError: string | null;
  formFieldError: ConnectorFormFieldError | null;
  pageError: string | null;
  reloadWarning: string | null;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  isDeleting: boolean;
  onBeginEdit: () => void;
  onDelete: () => void;
  onChangeDraft: <K extends keyof ConnectorFormDraft>(field: K, value: ConnectorFormDraft[K]) => void;
  onUpdateSettingsField: (field: string, value: string | boolean) => void;
  onKindChange: (kind: ConnectorFormDraft['kind']) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ConnectorDetailPanel(props: ConnectorDetailPanelProps) {
  const {
    mode,
    selectedConnector,
    draft,
    formError,
    formFieldError,
    pageError,
    reloadWarning,
    isSaving,
    saveStatus,
    isDeleting,
    onBeginEdit,
    onDelete,
    onChangeDraft,
    onUpdateSettingsField,
    onKindChange,
    onSave,
    onCancel,
  } = props;

  if (mode === 'create' || mode === 'edit') {
    return (
      <ConnectorForm
        mode={mode}
        draft={draft}
        isSaving={isSaving}
        saveStatus={saveStatus}
        formError={formError}
        formFieldError={formFieldError}
        onChange={onChangeDraft}
        onUpdateSettingsField={onUpdateSettingsField}
        onKindChange={onKindChange}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <Stack gap={16} className="connectors-detail">
      {!selectedConnector ? (
        <div className="connectors-empty">
          <Text tone="muted">Select a connector to see details, or create a new connector draft.</Text>
        </div>
      ) : (
        <Surface as="section">
          <Stack gap={12}>
            <Inline justify="between" align="center" wrap gap={12}>
              <div>
                <Text as="h3" variant="h2" weight="bold">
                  {selectedConnector.id}
                </Text>
                <Text tone="muted">
                  {selectedConnector.kind} · {selectedConnector.enabled ? 'enabled' : 'disabled'}
                </Text>
                <Text tone="muted" variant="small">
                  runtime_active={String(Boolean(selectedConnector.runtime_active))} · runtime_loaded=
                  {String(Boolean(selectedConnector.runtime_loaded))}
                </Text>
              </div>
              <Inline gap={12}>
                <Button type="button" variant="secondary" onClick={onBeginEdit}>
                  Edit
                </Button>
                <Button type="button" variant="secondary" onClick={onDelete} isLoading={isDeleting}>
                  Delete
                </Button>
              </Inline>
            </Inline>

            <div className="connectors-meta">
              <Text as="span" variant="small" tone="muted">
                Created: {selectedConnector.created_at}
              </Text>
              <Text as="span" variant="small" tone="muted">
                Updated: {selectedConnector.updated_at}
              </Text>
            </div>
          </Stack>
        </Surface>
      )}

      {pageError ? (
        <Surface as="section" className="connectors-error" padding={16}>
          <Text tone="danger" weight="bold">
            {pageError}
          </Text>
        </Surface>
      ) : null}

      {reloadWarning ? (
        <Surface as="section" className="connectors-warning" padding={16}>
          <Text weight="bold">{reloadWarning}</Text>
        </Surface>
      ) : null}
    </Stack>
  );
}
