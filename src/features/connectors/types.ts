export type ConnectorKind = 'sql_reader' | 'milvus' | 'kafka';

export interface ConnectorDraft {
  id: string;
  kind: ConnectorKind;
  enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConnectorDraftInput {
  id: string;
  kind: ConnectorKind;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface ConnectorsListResponse {
  connectors: ConnectorDraft[];
}

export interface ValidateConnectorsResponse {
  validated: true;
  connector_count: number;
  connector_ids: string[];
}

export interface ExportConnectorsResponse {
  yaml: string;
  connector_count: number;
  connector_ids: string[];
  validated: true;
}

export interface ApiErrorEnvelope {
  error: {
    message: string;
    type: string;
    param?: string | null;
    code?: string;
  };
}

export type EditorMode = 'view' | 'create' | 'edit';

export interface ConnectorFormDraft {
  id: string;
  kind: ConnectorKind;
  enabled: boolean;
  settingsText: string;
}

export type OperationState = 'idle' | 'loading' | 'success' | 'error';

export interface ConnectorApiError {
  message: string;
  code?: string;
  param?: string | null;
  status?: number;
}
