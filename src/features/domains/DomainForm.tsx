import { useMemo, useState } from 'react';

import { FormPageLayout } from '../../components/layouts';
import { Button, Inline, Input, Stack, Surface, Text } from '../../components/primitives';
import type { AgentToolInfo, DomainEditorMode, DomainFormDraft, DomainFormFieldError } from './types';

interface DomainFormProps {
  mode: Extract<DomainEditorMode, 'create' | 'edit'>;
  draft: DomainFormDraft;
  availableTools: AgentToolInfo[];
  isLoadingTools: boolean;
  toolsError: string | null;
  toolNames: string[];
  passthroughToolNames: string[];
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  formError: string | null;
  formFieldError: DomainFormFieldError | null;
  onChange: <K extends keyof DomainFormDraft>(field: K, value: DomainFormDraft[K]) => void;
  onAddToolName: (name: string) => void;
  onRemoveToolName: (name: string) => void;
  onAddPassthroughToolName: (name: string) => void;
  onRemovePassthroughToolName: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function fieldErrorFor(fieldError: DomainFormFieldError | null, field: string): string | undefined {
  return fieldError?.field === field ? fieldError.message : undefined;
}

export function DomainForm({
  mode,
  draft,
  availableTools,
  isLoadingTools,
  toolsError,
  toolNames,
  passthroughToolNames,
  isSaving,
  saveStatus,
  formError,
  formFieldError,
  onChange,
  onAddToolName,
  onRemoveToolName,
  onAddPassthroughToolName,
  onRemovePassthroughToolName,
  onSave,
  onCancel,
}: DomainFormProps) {
  const [toolInput, setToolInput] = useState('');
  const [passthroughInput, setPassthroughInput] = useState('');
  const [passthroughValidationMessage, setPassthroughValidationMessage] = useState<string | null>(null);
  const [toolValidationMessage, setToolValidationMessage] = useState<string | null>(null);

  const selectedToolSet = useMemo(() => new Set(toolNames), [toolNames]);
  const toolSuggestions = useMemo(
    () => availableTools.filter((tool) => !selectedToolSet.has(tool.name)),
    [availableTools, selectedToolSet],
  );
  const passthroughSuggestions = useMemo(
    () => toolNames.filter((name) => !passthroughToolNames.includes(name)),
    [passthroughToolNames, toolNames],
  );

  const addTool = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    onAddToolName(normalized);
    setToolInput('');
    setToolValidationMessage(null);
  };

  const addPassthrough = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    if (!selectedToolSet.has(normalized)) {
      setPassthroughValidationMessage('Passthrough tools must be selected in Tool names first.');
      return;
    }
    onAddPassthroughToolName(normalized);
    setPassthroughInput('');
    setPassthroughValidationMessage(null);
  };

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
          <Stack gap={8} className="domains-tools-picker">
            <Text as="label" variant="small" weight="medium">
              Tool names
            </Text>
            <Inline className="domains-tools-picker__input-row" gap={8} align="end" wrap>
              <input
                className="field-input"
                list="agent-tool-names-list"
                value={toolInput}
                onChange={(event) => setToolInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTool(toolInput);
                  }
                }}
                placeholder={isLoadingTools ? 'Loading tools...' : 'Add tool name'}
                aria-label="Tool names"
              />
              <Button type="button" variant="secondary" onClick={() => addTool(toolInput)}>
                Add
              </Button>
            </Inline>
            <datalist id="agent-tool-names-list">
              {availableTools.map((tool) => (
                <option key={tool.name} value={tool.name} />
              ))}
            </datalist>
            {toolValidationMessage ? <span className="field-error">{toolValidationMessage}</span> : null}
            <div className="domains-tools-picker__chips" aria-label="Selected tool names">
              {toolNames.length === 0 ? (
                <Text tone="muted" variant="small">
                  No tools selected.
                </Text>
              ) : (
                toolNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="domains-tools-picker__chip domains-tools-picker__chip--selected"
                    onClick={() => onRemoveToolName(name)}
                    aria-label={`Remove tool ${name}`}
                    title={`Remove ${name}`}
                  >
                    {name} <span aria-hidden="true">×</span>
                  </button>
                ))
              )}
            </div>
            {toolSuggestions.length > 0 ? (
              <div className="domains-tools-picker__suggestions">
                {toolSuggestions.slice(0, 8).map((tool) => (
                  <button
                    key={tool.name}
                    type="button"
                    className="domains-tools-picker__chip domains-tools-picker__chip--suggestion"
                    onClick={() => addTool(tool.name)}
                    title={tool.description}
                    aria-label={`Add tool ${tool.name}`}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            ) : null}
            {toolsError ? (
              <Text className="domains-tools-picker__warning" variant="small" tone="danger">
                Couldn&apos;t load tool registry. You can still enter tool names manually.
              </Text>
            ) : null}
          </Stack>

          <Stack gap={8} className="domains-tools-picker">
            <Text as="label" variant="small" weight="medium">
              Passthrough tool names
            </Text>
            <Inline className="domains-tools-picker__input-row" gap={8} align="end" wrap>
              <input
                className="field-input"
                list="agent-passthrough-tools-list"
                value={passthroughInput}
                onChange={(event) => setPassthroughInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addPassthrough(passthroughInput);
                  }
                }}
                placeholder="Add passthrough tool"
                aria-label="Passthrough tool names"
              />
              <Button type="button" variant="secondary" onClick={() => addPassthrough(passthroughInput)}>
                Add
              </Button>
            </Inline>
            <datalist id="agent-passthrough-tools-list">
              {toolNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {passthroughValidationMessage ? <span className="field-error">{passthroughValidationMessage}</span> : null}
            <div className="domains-tools-picker__chips" aria-label="Selected passthrough tool names">
              {passthroughToolNames.length === 0 ? (
                <Text tone="muted" variant="small">
                  No passthrough tools selected.
                </Text>
              ) : (
                passthroughToolNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="domains-tools-picker__chip domains-tools-picker__chip--selected"
                    onClick={() => onRemovePassthroughToolName(name)}
                    aria-label={`Remove passthrough tool ${name}`}
                    title={`Remove ${name}`}
                  >
                    {name} <span aria-hidden="true">×</span>
                  </button>
                ))
              )}
            </div>
            {passthroughSuggestions.length > 0 ? (
              <div className="domains-tools-picker__suggestions">
                {passthroughSuggestions.slice(0, 8).map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="domains-tools-picker__chip domains-tools-picker__chip--suggestion"
                    onClick={() => addPassthrough(name)}
                    aria-label={`Add passthrough ${name}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
          </Stack>
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
