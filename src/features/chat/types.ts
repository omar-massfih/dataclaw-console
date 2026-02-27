export type ChatRole = 'user' | 'assistant';

export type ChatMessageStatus = 'streaming' | 'done' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  status?: ChatMessageStatus;
}

export interface ChatRequestMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestInput {
  model: string;
  messages: ChatRequestMessage[];
}

export interface ChatApiErrorPayload {
  error?: {
    message?: string;
    code?: string;
    param?: string | null;
    type?: string;
  };
}

export interface ChatModelInfo {
  id: string;
}

export interface AgentStageProgress {
  type: 'agent_stage';
  timestamp: number;
  agent: string;
  stage: 'started' | 'terminal';
  action?: string;
  specialist_name?: string;
  domain_key?: string;
  domain_display_name?: string;
}

export interface ToolStartProgress {
  type: 'tool_start';
  timestamp: number;
  agent: string;
  tool_name: string;
  specialist_name?: string;
  domain_key?: string;
  domain_display_name?: string;
}

export interface ToolEndProgress {
  type: 'tool_end';
  timestamp: number;
  agent: string;
  tool_name: string;
  status: 'done';
  specialist_name?: string;
  domain_key?: string;
  domain_display_name?: string;
}

export type ChatProgressEvent = AgentStageProgress | ToolStartProgress | ToolEndProgress;

export interface ChatToolCallRecord {
  toolName: string;
  status: 'running' | 'done';
  startedAt: number;
  finishedAt?: number;
}

export interface ChatAgentHistoryEntry {
  agentName: string;
  specialistName?: string;
  domainKey?: string;
  domainDisplayName?: string;
  startedAt: number;
  endedAt?: number;
  tools: ChatToolCallRecord[];
}

export interface ChatAssistantProgressState {
  agentLabel: string | null;
  isAgentLoading: boolean;
  isToolsLoading: boolean;
  history: ChatAgentHistoryEntry[];
}
