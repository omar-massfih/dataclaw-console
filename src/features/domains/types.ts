export interface AgentHealthSnapshot {
  status: string;
  ready: boolean;
  domains: string[];
}

export interface AvailableDomain {
  key: string;
  label: string;
}

export interface DomainDraft {
  key: string;
  display_name: string;
  router_description: string;
  step_decider_description: string;
  router_examples: string[];
  supports_context_enrichment: boolean;
  is_recall_only: boolean;
  system_prompt: string;
  tool_names: string[];
  routing_keywords: string[];
  passthrough_tool_names: string[];
  specialist_prompt_rules: string[];
  created_at: string;
  updated_at: string;
}

export interface DomainDraftInput {
  key: string;
  display_name: string;
  router_description: string;
  step_decider_description: string;
  router_examples: string[];
  supports_context_enrichment: boolean;
  is_recall_only: boolean;
  system_prompt: string;
  tool_names: string[];
  routing_keywords: string[];
  passthrough_tool_names: string[];
  specialist_prompt_rules: string[];
}

export interface DomainRuntimeReloadState {
  at?: string | null;
  succeeded?: boolean | null;
  trigger?: string | null;
  reason?: string | null;
  error?: string | null;
}

export interface DomainRuntimePayload {
  source_of_truth: 'sqlite';
  generation: number;
  last_reload?: DomainRuntimeReloadState | null;
  active_domain_keys: string[];
  reload_in_progress: boolean;
}

export interface DomainImportStatePayload {
  mode: 'startup_once';
  source_path?: string | null;
  attempted: boolean;
  succeeded: boolean;
  last_imported_at?: string | null;
  last_import_file_hash?: string | null;
  last_import_result?: string | null;
  last_error?: string | null;
}

export interface DomainReloadPayload {
  attempted: boolean;
  succeeded: boolean;
  trigger: string;
  reason: string;
  runtime: DomainRuntimePayload;
  error?: {
    type: string;
    message: string;
  };
}

export interface DomainsListResponse {
  domains: DomainDraft[];
  runtime: DomainRuntimePayload;
  import_state: DomainImportStatePayload;
}

export interface DomainMutationInlineError {
  message: string;
  type: string;
  param?: string | null;
  code?: string;
}

export interface CreateOrUpdateDomainResponse {
  saved: boolean;
  domain: DomainDraft;
  reload: DomainReloadPayload;
  runtime: DomainRuntimePayload;
  import_state: DomainImportStatePayload;
  error?: DomainMutationInlineError;
}

export interface DeleteDomainResponse {
  deleted: boolean;
  key: string;
  reload: DomainReloadPayload;
  runtime: DomainRuntimePayload;
  import_state: DomainImportStatePayload;
  error?: DomainMutationInlineError;
}

export interface DomainApiErrorEnvelope {
  error: {
    message: string;
    type: string;
    param?: string | null;
    code?: string;
  };
}

export interface DomainApiError {
  message: string;
  code?: string;
  param?: string | null;
  status?: number;
}

export type DomainEditorMode = 'view' | 'create' | 'edit';

export interface DomainFormDraft {
  key: string;
  display_name: string;
  router_description: string;
  step_decider_description: string;
  router_examples_text: string;
  supports_context_enrichment: boolean;
  is_recall_only: boolean;
  system_prompt: string;
  tool_names_text: string;
  routing_keywords_text: string;
  passthrough_tool_names_text: string;
  specialist_prompt_rules_text: string;
}

export interface DomainFormFieldError {
  field: string;
  message: string;
}
