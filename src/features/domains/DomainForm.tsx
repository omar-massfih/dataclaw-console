import { FormPageLayout } from '../../components/layouts';
import { Button, Inline, Input, Stack, Surface, Text } from '../../components/primitives';
import type { DomainEditorMode, DomainFormDraft, DomainFormFieldError } from './types';

interface DomainFormProps {
  mode: Extract<DomainEditorMode, 'create' | 'edit'>;
  draft: DomainFormDraft;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  formError: string | null;
  formFieldError: DomainFormFieldError | null;
  onChange: <K extends keyof DomainFormDraft>(field: K, value: DomainFormDraft[K]) => void;
  onSave: () => void;
  onCancel: () => void;
}

function fieldErrorFor(fieldError: DomainFormFieldError | null, field: string): string | undefined {
  return fieldError?.field === field ? fieldError.message : undefined;
}

export function DomainForm({
  mode,
  draft,
  isSaving,
  saveStatus,
  formError,
  formFieldError,
  onChange,
  onSave,
  onCancel,
}: DomainFormProps) {
  const sections = (
    <>
      <Surface as="section">
        <Stack gap={12}>
          <Text as="h3" variant="h3" weight="bold">
            Basics
          </Text>
          <Input
            label="Agent key"
            value={draft.key}
            onChange={(event) => onChange('key', event.target.value)}
            disabled={mode === 'edit'}
            error={fieldErrorFor(formFieldError, 'key')}
            placeholder="sql"
          />
          <Input
            label="Display name"
            value={draft.display_name}
            onChange={(event) => onChange('display_name', event.target.value)}
            placeholder="SQL"
          />
          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={draft.supports_context_enrichment}
              onChange={(event) => onChange('supports_context_enrichment', event.target.checked)}
            />
            <span>Supports context enrichment</span>
          </label>
          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={draft.is_recall_only}
              onChange={(event) => onChange('is_recall_only', event.target.checked)}
            />
            <span>Recall-only agent</span>
          </label>
        </Stack>
      </Surface>

      <Surface as="section">
        <Stack gap={12}>
          <Text as="h3" variant="h3" weight="bold">
            Routing
          </Text>
          <label className="field-label">
            Router description
            <textarea
              className="field-input connectors-form-json"
              rows={3}
              value={draft.router_description}
              onChange={(event) => onChange('router_description', event.target.value)}
            />
          </label>
          <label className="field-label">
            Step decider description
            <textarea
              className="field-input connectors-form-json"
              rows={3}
              value={draft.step_decider_description}
              onChange={(event) => onChange('step_decider_description', event.target.value)}
            />
          </label>
          <label className="field-label">
            Router examples (one per line)
            <textarea
              className="field-input connectors-form-json"
              rows={5}
              value={draft.router_examples_text}
              onChange={(event) => onChange('router_examples_text', event.target.value)}
            />
          </label>
          <label className="field-label">
            Routing keywords (one per line)
            <textarea
              className="field-input connectors-form-json"
              rows={5}
              value={draft.routing_keywords_text}
              onChange={(event) => onChange('routing_keywords_text', event.target.value)}
            />
          </label>
        </Stack>
      </Surface>

      <Surface as="section">
        <Stack gap={12}>
          <Text as="h3" variant="h3" weight="bold">
            Tools
          </Text>
          <label className="field-label">
            Tool names (one per line)
            <textarea
              className="field-input connectors-form-json"
              rows={5}
              value={draft.tool_names_text}
              onChange={(event) => onChange('tool_names_text', event.target.value)}
            />
          </label>
          <label className="field-label">
            Passthrough tool names (one per line)
            <textarea
              className="field-input connectors-form-json"
              rows={5}
              value={draft.passthrough_tool_names_text}
              onChange={(event) => onChange('passthrough_tool_names_text', event.target.value)}
            />
          </label>
        </Stack>
      </Surface>

      <Surface as="section">
        <Stack gap={12}>
          <Text as="h3" variant="h3" weight="bold">
            Prompts
          </Text>
          <label className="field-label">
            System prompt
            <textarea
              className="field-input connectors-form-json"
              rows={6}
              value={draft.system_prompt}
              onChange={(event) => onChange('system_prompt', event.target.value)}
            />
          </label>
          <label className="field-label">
            Specialist prompt rules (one per line)
            <textarea
              className="field-input connectors-form-json"
              rows={6}
              value={draft.specialist_prompt_rules_text}
              onChange={(event) => onChange('specialist_prompt_rules_text', event.target.value)}
            />
          </label>
        </Stack>
      </Surface>

      {formError ? (
        <Surface as="section" className="domains-error" padding={16}>
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
        {mode === 'edit' ? 'Agent key is locked in edit mode.' : 'Create a new agent draft.'}
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
      className="domains-detail"
      title=""
      description=""
      sections={sections}
      actions={actions}
    />
  );
}
