import type { DomainDraft, DomainDraftInput, DomainFormDraft, DomainFormFieldError } from './types';

type SerializeResult =
  | { ok: true; value: DomainDraftInput }
  | { ok: false; error: DomainFormFieldError };

function toLines(values: string[]): string {
  return values.join('\n');
}

function fromLines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function trim(input: string): string {
  return input.trim();
}

export function createDefaultDomainFormDraft(): DomainFormDraft {
  return {
    key: '',
    display_name: '',
    router_description: '',
    step_decider_description: '',
    router_examples_text: '',
    supports_context_enrichment: true,
    is_recall_only: false,
    system_prompt: '',
    tool_names_text: '',
    routing_keywords_text: '',
    passthrough_tool_names_text: '',
    specialist_prompt_rules_text: '',
  };
}

export function domainToFormDraft(domain: DomainDraft): DomainFormDraft {
  return {
    key: domain.key,
    display_name: domain.display_name,
    router_description: domain.router_description,
    step_decider_description: domain.step_decider_description,
    router_examples_text: toLines(domain.router_examples),
    supports_context_enrichment: domain.supports_context_enrichment,
    is_recall_only: domain.is_recall_only,
    system_prompt: domain.system_prompt,
    tool_names_text: toLines(domain.tool_names),
    routing_keywords_text: toLines(domain.routing_keywords),
    passthrough_tool_names_text: toLines(domain.passthrough_tool_names),
    specialist_prompt_rules_text: toLines(domain.specialist_prompt_rules),
  };
}

export function serializeDomainFormDraft(draft: DomainFormDraft): SerializeResult {
  const key = trim(draft.key);
  if (!key) {
    return {
      ok: false,
      error: { field: 'key', message: 'Domain key is required.' },
    };
  }

  return {
    ok: true,
    value: {
      key,
      display_name: trim(draft.display_name),
      router_description: trim(draft.router_description),
      step_decider_description: trim(draft.step_decider_description),
      router_examples: fromLines(draft.router_examples_text),
      supports_context_enrichment: draft.supports_context_enrichment,
      is_recall_only: draft.is_recall_only,
      system_prompt: trim(draft.system_prompt),
      tool_names: fromLines(draft.tool_names_text),
      routing_keywords: fromLines(draft.routing_keywords_text),
      passthrough_tool_names: fromLines(draft.passthrough_tool_names_text),
      specialist_prompt_rules: fromLines(draft.specialist_prompt_rules_text),
    },
  };
}
