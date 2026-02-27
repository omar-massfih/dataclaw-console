export type ConnectorKind = 'sql_reader' | 'milvus' | 'kafka';
export type KafkaSecurityProtocol = 'PLAINTEXT' | 'SASL_PLAINTEXT' | 'SSL' | 'SASL_SSL';
export type KafkaSaslMechanism = 'PLAIN' | 'SCRAM-SHA-256' | 'SCRAM-SHA-512';

export interface ConnectorDraft {
  id: string;
  kind: ConnectorKind;
  enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  runtime_active?: boolean;
  runtime_loaded?: boolean;
}

export interface ConnectorDraftInput {
  id: string;
  kind: ConnectorKind;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface RuntimeReloadState {
  at?: string | null;
  succeeded?: boolean | null;
  trigger?: string | null;
  reason?: string | null;
  error?: string | null;
}

export interface RuntimePayload {
  source_of_truth: 'sqlite';
  generation: number;
  last_reload?: RuntimeReloadState | null;
  active_connector_ids: string[];
  reload_in_progress: boolean;
}

export interface ImportStatePayload {
  mode: 'startup_once';
  source_path?: string | null;
  attempted: boolean;
  succeeded: boolean;
  last_imported_at?: string | null;
  last_import_file_hash?: string | null;
  last_import_result?: string | null;
  last_error?: string | null;
}

export interface ReloadPayload {
  attempted: boolean;
  succeeded: boolean;
  trigger: string;
  reason: string;
  runtime: RuntimePayload;
  error?: {
    type: string;
    message: string;
  };
}

export interface ConnectorsListResponse {
  connectors: ConnectorDraft[];
  runtime: RuntimePayload;
  import_state: ImportStatePayload;
}

export interface MutationInlineError {
  message: string;
  type: string;
  param?: string | null;
  code?: string;
}

export interface CreateOrUpdateConnectorResponse {
  saved: boolean;
  connector: ConnectorDraft;
  reload: ReloadPayload;
  runtime: RuntimePayload;
  import_state: ImportStatePayload;
  error?: MutationInlineError;
}

export interface DeleteConnectorResponse {
  deleted: boolean;
  id: string;
  reload: ReloadPayload;
  runtime: RuntimePayload;
  import_state: ImportStatePayload;
  error?: MutationInlineError;
}

export interface UploadConnectorSslCafileResponse {
  uploaded: true;
  connector: ConnectorDraft;
  file: {
    path: string;
    size_bytes: number;
    sha256: string;
  };
  reload: ReloadPayload;
  runtime: RuntimePayload;
  import_state: ImportStatePayload;
  error?: MutationInlineError;
}

export interface UploadStagedSslCafileResponse {
  uploaded: true;
  file: {
    path: string;
    size_bytes: number;
    sha256: string;
  };
}

export type UploadedSslCafilePayload = UploadConnectorSslCafileResponse['file'];

export interface ApiErrorEnvelope {
  error: {
    message: string;
    type: string;
    param?: string | null;
    code?: string;
  };
}

export type EditorMode = 'view' | 'create' | 'edit';

export interface SqlReaderSettingsDraft {
  database_url: string;
  allowed_tables_text: string;
  enable_sql_text_tool: boolean;
  timeout_seconds: string;
  source: string;
}

export interface MilvusSettingsDraft {
  uri: string;
  collections_text: string;
  database: string;
  timeout_seconds: string;
  token: string;
  source: string;
}

export interface KafkaSettingsDraft {
  bootstrap_servers_text: string;
  allowed_topics_text: string;
  security_protocol: KafkaSecurityProtocol;
  ssl_cafile: string;
  sasl_mechanism: KafkaSaslMechanism;
  sasl_username: string;
  sasl_password: string;
  client_id: string;
  group_id: string;
  request_timeout_ms: string;
  source: string;
}

export type ConnectorSettingsDraft =
  | { kind: 'sql_reader'; values: SqlReaderSettingsDraft }
  | { kind: 'milvus'; values: MilvusSettingsDraft }
  | { kind: 'kafka'; values: KafkaSettingsDraft };

export interface ConnectorFormDraft {
  id: string;
  kind: ConnectorKind;
  enabled: boolean;
  settings: ConnectorSettingsDraft;
}

export type OperationState = 'idle' | 'loading' | 'success' | 'error';

export interface ConnectorApiError {
  message: string;
  code?: string;
  param?: string | null;
  status?: number;
}

export interface ConnectorFormFieldError {
  field: string;
  message: string;
}
