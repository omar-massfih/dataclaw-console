import { useMemo, useState } from 'react';

import { FormPageLayout } from '../../components/layouts';
import { Button, FormSectionHeader, InfoTooltip, Inline, Input, Stack, Surface, Text } from '../../components/primitives';
import type { AgentToolInfo, DomainEditorMode, DomainFormDraft, DomainFormFieldError } from './types';

interface DomainFormProps {
  mode: Extract<DomainEditorMode, 'create' | 'edit'>;
  draft: DomainFormDraft;
  availableTools: AgentToolInfo[];
  isLoadingTools: boolean;
  toolsError: string | null;
  toolSearchHits: AgentToolInfo[];
  isSearchingTools: boolean;
  toolSearchError: string | null;
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
  onToolSearchQueryChange: (query: string) => void;
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
  toolSearchHits,
  isSearchingTools,
  toolSearchError,
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
  onToolSearchQueryChange,
  onSave,
  onCancel,
}: DomainFormProps) {
  const [toolInput, setToolInput] = useState('');
  const [passthroughInput, setPassthroughInput] = useState('');
  const [passthroughValidationMessage, setPassthroughValidationMessage] = useState<string | null>(null);
  const [toolValidationMessage, setToolValidationMessage] = useState<string | null>(null);

  const selectedToolSet = useMemo(() => new Set(toolNames), [toolNames]);
  const availableToolNames = useMemo(() => new Set(availableTools.map((tool) => tool.name)), [availableTools]);
  const toolQuery = toolInput.trim().toLowerCase();
  const fallbackFilteredTools = useMemo(
    () =>
      availableTools.filter(
        (tool) => !selectedToolSet.has(tool.name) && (!toolQuery || tool.name.toLowerCase().includes(toolQuery)),
      ),
    [availableTools, selectedToolSet, toolQuery],
  );
  const toolSuggestions = useMemo(
    () =>
      toolQuery && toolSearchHits.length > 0
        ? toolSearchHits.filter((tool) => !selectedToolSet.has(tool.name))
        : fallbackFilteredTools,
    [fallbackFilteredTools, selectedToolSet, toolQuery, toolSearchHits],
  );
  const passthroughSuggestions = useMemo(
    () => toolNames.filter((name) => !passthroughToolNames.includes(name)),
    [passthroughToolNames, toolNames],
  );

  const addTool = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    if (!availableToolNames.has(normalized)) {
      setToolValidationMessage('Use this to pick a tool from suggestions. Only existing tools are allowed.');
      return;
    }
    onAddToolName(normalized);
    setToolInput('');
    onToolSearchQueryChange('');
    setToolValidationMessage(null);
  };

  const addPassthrough = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    if (!selectedToolSet.has(normalized)) {
      setPassthroughValidationMessage('Use this to add passthrough tools from Tool names only.');
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
          <FormSectionHeader
            title="Basics"
            tooltip="Use this to set agent identity and behavior flags."
          />
          <Input
            label="Agent key"
            infoTooltip="Use this to name the agent key used by routing and storage. Required. You can't change it after save."
            value={draft.key}
            onChange={(event) => onChange('key', event.target.value)}
            disabled={mode === 'edit'}
            error={fieldErrorFor(formFieldError, 'key')}
            placeholder="sql"
          />
          <Input
            label="Display name"
            infoTooltip="Use this to set the display name shown in the UI. Required."
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
            <InfoTooltip
              label="About Supports context enrichment"
              content="Use this to allow extra context to be passed to this agent. Optional."
            />
          </label>
          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={draft.is_recall_only}
              onChange={(event) => onChange('is_recall_only', event.target.checked)}
            />
            <span>Recall-only agent</span>
            <InfoTooltip
              label="About Recall-only agent"
              content="Use this for agents that focus on recall-style responses. Optional."
            />
          </label>
        </Stack>
      </Surface>

      <Surface as="section">
        <Stack gap={12}>
          <FormSectionHeader
            title="Routing"
            tooltip="Use this to describe when the orchestrator should choose this agent."
          />
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">Router description</span>
              <InfoTooltip
                label="About Router description"
                content="Use this to describe when this agent should be selected. Required."
              />
            </span>
            <textarea
              className="field-input connectors-form-json"
              aria-label="Router description"
              rows={3}
              value={draft.router_description}
              onChange={(event) => onChange('router_description', event.target.value)}
            />
          </label>
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">Step decider description</span>
              <InfoTooltip
                label="About Step decider description"
                content="Use this to guide step-by-step handoff decisions. Required."
              />
            </span>
            <textarea
              className="field-input connectors-form-json"
              aria-label="Step decider description"
              rows={3}
              value={draft.step_decider_description}
              onChange={(event) => onChange('step_decider_description', event.target.value)}
            />
          </label>
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">Router examples (one per line)</span>
              <InfoTooltip
                label="About Router examples"
                content="Use this to add example requests that should route here. Optional."
              />
            </span>
            <textarea
              className="field-input connectors-form-json"
              aria-label="Router examples"
              rows={5}
              value={draft.router_examples_text}
              onChange={(event) => onChange('router_examples_text', event.target.value)}
            />
          </label>
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">Routing keywords (one per line)</span>
              <InfoTooltip
                label="About Routing keywords"
                content="Use this to add keywords that help match this agent. Optional."
              />
            </span>
            <textarea
              className="field-input connectors-form-json"
              aria-label="Routing keywords"
              rows={5}
              value={draft.routing_keywords_text}
              onChange={(event) => onChange('routing_keywords_text', event.target.value)}
            />
          </label>
        </Stack>
      </Surface>

      <Surface as="section">
        <Stack gap={12}>
          <FormSectionHeader
            title="Tools"
            tooltip="Use this to choose tools this agent can call."
          />
          <Stack gap={8} className="domains-tools-picker">
            <Text as="label" variant="small" weight="medium">
              <span className="field-label__row">
                <span className="field-label__title">Tool names</span>
                <InfoTooltip
                  label="About Tool names"
                  content="Use this to choose tools this agent may call. Required tools must exist in the registry."
                />
              </span>
            </Text>
            <Inline className="domains-tools-picker__input-row" gap={8} align="end" wrap>
              <input
                className="field-input"
                list="agent-tool-names-list"
                value={toolInput}
                onChange={(event) => {
                  const next = event.target.value;
                  setToolInput(next);
                  setToolValidationMessage(null);
                  onToolSearchQueryChange(next);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTool(toolInput);
                  }
                }}
                placeholder={isLoadingTools ? 'Loading tools...' : 'Search and add tool name'}
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
            {toolInput.trim() && isSearchingTools ? (
              <Text className="domains-tools-picker__search-status" variant="small" tone="muted">
                Searching tools...
              </Text>
            ) : null}
            {toolInput.trim() && toolSearchError ? (
              <Text className="domains-tools-picker__search-warning" variant="small">
                Tool search is unavailable. Use registry suggestions instead.
              </Text>
            ) : null}
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
                Couldn&apos;t load tool registry. Tool names still need to match registered tools.
              </Text>
            ) : null}
          </Stack>

          <Stack gap={8} className="domains-tools-picker">
            <Text as="label" variant="small" weight="medium">
              <span className="field-label__row">
                <span className="field-label__title">Passthrough tool names</span>
                <InfoTooltip
                  label="About Passthrough tool names"
                  content="Use this to allow passthrough tools. Only tools already selected in Tool names are allowed."
                />
              </span>
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
          <FormSectionHeader
            title="Prompts"
            tooltip="Use this to set the core instructions for this agent."
          />
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">System prompt</span>
              <InfoTooltip
                label="About System prompt"
                content="Use this to define the main instruction prompt for this agent. Required."
              />
            </span>
            <textarea
              className="field-input connectors-form-json"
              aria-label="System prompt"
              rows={6}
              value={draft.system_prompt}
              onChange={(event) => onChange('system_prompt', event.target.value)}
            />
          </label>
          <label className="field-label">
            <span className="field-label__row">
              <span className="field-label__title">Specialist prompt rules (one per line)</span>
              <InfoTooltip
                label="About Specialist prompt rules"
                content="Use this to add extra line-by-line rules for this agent. Optional."
              />
            </span>
            <textarea
              className="field-input connectors-form-json"
              aria-label="Specialist prompt rules"
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
