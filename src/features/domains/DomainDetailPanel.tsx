import { Button, Inline, Stack, Surface, Text } from '../../components/primitives';
import { DomainForm } from './DomainForm';
import type { DomainDraft, DomainEditorMode, DomainFormDraft, DomainFormFieldError } from './types';

interface DomainDetailPanelProps {
  mode: DomainEditorMode;
  selectedDomain: DomainDraft | null;
  draft: DomainFormDraft;
  formError: string | null;
  formFieldError: DomainFormFieldError | null;
  pageError: string | null;
  reloadWarning: string | null;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  isDeleting: boolean;
  onBeginEdit: () => void;
  onDelete: () => void;
  onChangeDraft: <K extends keyof DomainFormDraft>(field: K, value: DomainFormDraft[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function DomainDetailPanel({
  mode,
  selectedDomain,
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
  onSave,
  onCancel,
}: DomainDetailPanelProps) {
  if (mode === 'create' || mode === 'edit') {
    return (
      <DomainForm
        mode={mode}
        draft={draft}
        isSaving={isSaving}
        saveStatus={saveStatus}
        formError={formError}
        formFieldError={formFieldError}
        onChange={onChangeDraft}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <Stack gap={16} className="domains-detail">
      {!selectedDomain ? (
        <div className="domains-empty">
          <Text tone="muted">Select an agent to see details, or create a new agent draft.</Text>
        </div>
      ) : (
        <Surface as="section">
          <Stack gap={12}>
            <Inline justify="between" align="center" wrap gap={12}>
              <div>
                <Text as="h3" variant="h2" weight="bold">
                  {selectedDomain.key}
                </Text>
                <Text tone="muted">{selectedDomain.display_name || '(no display name)'}</Text>
                <Text tone="muted" variant="small">
                  tools={selectedDomain.tool_names.length} · keywords={selectedDomain.routing_keywords.length}
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
            <div className="domains-meta">
              <Text as="span" variant="small" tone="muted">
                Created: {selectedDomain.created_at}
              </Text>
              <Text as="span" variant="small" tone="muted">
                Updated: {selectedDomain.updated_at}
              </Text>
            </div>
          </Stack>
        </Surface>
      )}

      {pageError ? (
        <Surface as="section" className="domains-error" padding={16}>
          <Text tone="danger" weight="bold">
            {pageError}
          </Text>
        </Surface>
      ) : null}

      {reloadWarning ? (
        <Surface as="section" className="domains-warning" padding={16}>
          <Text weight="bold">{reloadWarning}</Text>
        </Surface>
      ) : null}
    </Stack>
  );
}
