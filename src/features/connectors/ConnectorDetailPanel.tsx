import { Button,Inline, Stack, Surface, Text } from '../../components/primitives';
import { ConnectorForm } from './ConnectorForm';
import type {
  ConnectorDraft,
  ConnectorFormDraft,
  EditorMode,
  ExportConnectorsResponse,
  ValidateConnectorsResponse,
} from './types';

interface ConnectorDetailPanelProps {
  mode: EditorMode;
  selectedConnector: ConnectorDraft | null;
  draft: ConnectorFormDraft;
  formError: string | null;
  jsonParseError: string | null;
  pageError: string | null;
  validateResult: ValidateConnectorsResponse | null;
  exportResult: ExportConnectorsResponse | null;
  isSaving: boolean;
  isDeleting: boolean;
  onBeginEdit: () => void;
  onDelete: () => void;
  onChangeDraft: <K extends keyof ConnectorFormDraft>(field: K, value: ConnectorFormDraft[K]) => void;
  onKindChange: (kind: ConnectorFormDraft['kind']) => void;
  onResetSettingsTemplate: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ConnectorDetailPanel(props: ConnectorDetailPanelProps) {
  const {
    mode,
    selectedConnector,
    draft,
    formError,
    jsonParseError,
    pageError,
    validateResult,
    exportResult,
    isSaving,
    isDeleting,
    onBeginEdit,
    onDelete,
    onChangeDraft,
    onKindChange,
    onResetSettingsTemplate,
    onSave,
    onCancel,
  } = props;

  if (mode === 'create' || mode === 'edit') {
    return (
      <ConnectorForm
        mode={mode}
        draft={draft}
        isSaving={isSaving}
        formError={formError}
        jsonParseError={jsonParseError}
        onChange={onChangeDraft}
        onKindChange={onKindChange}
        onResetSettingsTemplate={onResetSettingsTemplate}
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

            <Stack gap={8}>
              <Text as="h3" variant="h3" weight="bold">
                Settings (read-only)
              </Text>
              <pre className="connectors-export">
                <code>{JSON.stringify(selectedConnector.settings, null, 2)}</code>
              </pre>
            </Stack>
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

      {validateResult ? (
        <Surface as="section">
          <Stack gap={8}>
            <Text as="h3" variant="h3" weight="bold">
              Validation result
            </Text>
            <Text tone="muted">
              Validated {validateResult.connector_count} connector(s): {validateResult.connector_ids.join(', ') || '(none)'}
            </Text>
          </Stack>
        </Surface>
      ) : null}

      {exportResult ? (
        <Surface as="section">
          <Stack gap={12}>
            <Text as="h3" variant="h3" weight="bold">
              YAML export
            </Text>
            <Text tone="muted">
              {exportResult.connector_count} connector(s) · validated={String(exportResult.validated)}
            </Text>
            <pre className="connectors-export">
              <code>{exportResult.yaml}</code>
            </pre>
          </Stack>
        </Surface>
      ) : null}
    </Stack>
  );
}
