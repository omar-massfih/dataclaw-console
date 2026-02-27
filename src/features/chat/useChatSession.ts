import { useEffect, useRef, useState } from 'react';

import { listChatModels, startChatCompletionStream } from './api';
import type {
  ChatAssistantProgressState,
  ChatMessage,
  ChatModelInfo,
  ChatProgressEvent,
  ChatRequestMessage,
} from './types';

const DEFAULT_MODEL = '';
const FALLBACK_AGENT_LABEL = 'Thinking';
const FALLBACK_AGENT_NAME = 'Orchestrator';

function createMessageId(prefix: 'user' | 'assistant'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeConversation(messages: ChatMessage[]): ChatRequestMessage[] {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function createEmptyAssistantProgressState(
  initialLabel: string = FALLBACK_AGENT_LABEL,
  isAgentLoading = false,
): ChatAssistantProgressState {
  return {
    agentLabel: initialLabel,
    isAgentLoading,
    isToolsLoading: false,
    history: [],
  };
}

interface AgentMetadata {
  specialistName?: string;
  domainKey?: string;
  domainDisplayName?: string;
}

export function useChatSession() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ChatModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [assistantProgressByMessageId, setAssistantProgressByMessageId] = useState<
    Record<string, ChatAssistantProgressState>
  >({});

  const streamAbortRef = useRef<AbortController | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);

  const canSend = inputText.trim().length > 0 && !isStreaming;

  useEffect(() => {
    let cancelled = false;
    setIsLoadingModels(true);
    setModelsError(null);
    void listChatModels().then((result) => {
      if (cancelled) {
        return;
      }
      setIsLoadingModels(false);
      if (result.error) {
        setModelsError(result.error);
        return;
      }
      const models = result.data ?? [];
      setAvailableModels(models);
      if (models.length > 0) {
        setModel((currentModel) => (currentModel ? currentModel : models[0].id));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const stopStreaming = () => {
    const assistantId = activeAssistantIdRef.current;
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsStreaming(false);
    if (assistantId) {
      finalizeMessageProgress(assistantId);
    }
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== assistantId || message.status !== 'streaming') {
          return message;
        }
        return { ...message, status: 'done' };
      }),
    );
    activeAssistantIdRef.current = null;
  };

  const clearConversation = () => {
    stopStreaming();
    setMessages([]);
    setChatError(null);
    setAssistantProgressByMessageId({});
  };

  const appendAgentStarted = (messageId: string, agentName: string, timestamp: number, metadata?: AgentMetadata) => {
    const normalizedAgentName = agentName.trim() || FALLBACK_AGENT_NAME;
    setAssistantProgressByMessageId((current) => {
      const existing = current[messageId] ?? createEmptyAssistantProgressState(FALLBACK_AGENT_LABEL, true);
      const history = [...existing.history];
      const lastEntry = history.at(-1);

      if (lastEntry?.agentName === normalizedAgentName) {
        return {
          ...current,
          [messageId]: {
            ...existing,
            agentLabel: metadata?.specialistName ?? normalizedAgentName,
            isAgentLoading: true,
          },
        };
      }

      if (lastEntry && lastEntry.endedAt === undefined) {
        history[history.length - 1] = { ...lastEntry, endedAt: timestamp };
      }

      history.push({
        agentName: normalizedAgentName,
        specialistName: metadata?.specialistName,
        domainKey: metadata?.domainKey,
        domainDisplayName: metadata?.domainDisplayName,
        startedAt: timestamp,
        tools: [],
      });

      return {
        ...current,
        [messageId]: {
          ...existing,
          agentLabel: metadata?.specialistName ?? normalizedAgentName,
          isAgentLoading: true,
          history,
        },
      };
    });
  };

  const appendOrUpdateTool = (
    messageId: string,
    toolName: string,
    status: 'running' | 'done',
    timestamp: number,
    metadata?: AgentMetadata,
  ) => {
    setAssistantProgressByMessageId((current) => {
      const existing = current[messageId] ?? createEmptyAssistantProgressState(FALLBACK_AGENT_LABEL, true);
      const history = [...existing.history];

      if (history.length === 0) {
        const candidateAgentName = existing.agentLabel?.trim();
        history.push({
          agentName: candidateAgentName && candidateAgentName.length > 0 ? candidateAgentName : FALLBACK_AGENT_NAME,
          specialistName: metadata?.specialistName,
          domainKey: metadata?.domainKey,
          domainDisplayName: metadata?.domainDisplayName,
          startedAt: timestamp,
          tools: [],
        });
      }

      if (status === 'running') {
        const activeAgentIndex = history.length - 1;
        const activeAgent = history[activeAgentIndex];
        const hasRunning = activeAgent.tools.some((tool) => tool.toolName === toolName && tool.status === 'running');
        if (!hasRunning) {
          history[activeAgentIndex] = {
            ...activeAgent,
            tools: [...activeAgent.tools, { toolName, status: 'running', startedAt: timestamp }],
          };
        }
      } else {
        for (let historyIndex = history.length - 1; historyIndex >= 0; historyIndex -= 1) {
          const agent = history[historyIndex];
          for (let toolIndex = agent.tools.length - 1; toolIndex >= 0; toolIndex -= 1) {
            const tool = agent.tools[toolIndex];
              if (tool.toolName === toolName && tool.status === 'running') {
                const nextTools = [...agent.tools];
                nextTools[toolIndex] = { ...tool, status: 'done' as const, finishedAt: timestamp };
                history[historyIndex] = { ...agent, tools: nextTools };
                historyIndex = -1;
                break;
            }
          }
        }
      }

      const hasRunningTools = history.some((agent) => agent.tools.some((tool) => tool.status === 'running'));

      return {
        ...current,
        [messageId]: {
          ...existing,
          history,
          isToolsLoading: hasRunningTools,
        },
      };
    });
  };

  const finalizeMessageProgress = (messageId: string) => {
    const finishedAt = Math.floor(Date.now() / 1000);
    setAssistantProgressByMessageId((current) => {
      const existing = current[messageId];
      if (!existing) {
        return current;
      }
      const history = existing.history.map((agent) => ({
        ...agent,
        endedAt: agent.endedAt ?? finishedAt,
        tools: agent.tools.map((tool) =>
          tool.status === 'running' ? { ...tool, status: 'done' as const, finishedAt } : tool,
        ),
      }));
      return {
        ...current,
        [messageId]: {
          ...existing,
          isAgentLoading: false,
          isToolsLoading: false,
          history,
        },
      };
    });
  };

  const handleProgressEvent = (event: ChatProgressEvent) => {
    const messageId = activeAssistantIdRef.current;
    if (!messageId) {
      return;
    }
    if (event.type === 'agent_stage') {
      const candidateAgentName = event.agent?.trim();
      const nextAgent = candidateAgentName && candidateAgentName.length > 0 ? candidateAgentName : FALLBACK_AGENT_NAME;
      const metadata: AgentMetadata = {
        specialistName:
          typeof event.specialist_name === 'string' && event.specialist_name.trim().length > 0
            ? event.specialist_name.trim()
            : undefined,
        domainKey: typeof event.domain_key === 'string' && event.domain_key.trim().length > 0 ? event.domain_key.trim() : undefined,
        domainDisplayName:
          typeof event.domain_display_name === 'string' && event.domain_display_name.trim().length > 0
            ? event.domain_display_name.trim()
            : undefined,
      };
      if (event.stage === 'started') {
        appendAgentStarted(messageId, nextAgent, event.timestamp, metadata);
      } else {
        setAssistantProgressByMessageId((current) => {
          const existing = current[messageId];
          if (!existing) {
            return current;
          }
          return {
            ...current,
            [messageId]: {
              ...existing,
              agentLabel: metadata.specialistName ?? nextAgent,
              isAgentLoading: false,
            },
          };
        });
      }
      return;
    }

    if (event.type === 'tool_start') {
      appendOrUpdateTool(
        messageId,
        event.tool_name,
        'running',
        event.timestamp,
        {
          specialistName:
            typeof event.specialist_name === 'string' && event.specialist_name.trim().length > 0
              ? event.specialist_name.trim()
              : undefined,
          domainKey:
            typeof event.domain_key === 'string' && event.domain_key.trim().length > 0 ? event.domain_key.trim() : undefined,
          domainDisplayName:
            typeof event.domain_display_name === 'string' && event.domain_display_name.trim().length > 0
              ? event.domain_display_name.trim()
              : undefined,
        },
      );
      return;
    }

    appendOrUpdateTool(
      messageId,
      event.tool_name,
      'done',
      event.timestamp,
      {
        specialistName:
          typeof event.specialist_name === 'string' && event.specialist_name.trim().length > 0
            ? event.specialist_name.trim()
            : undefined,
        domainKey: typeof event.domain_key === 'string' && event.domain_key.trim().length > 0 ? event.domain_key.trim() : undefined,
        domainDisplayName:
          typeof event.domain_display_name === 'string' && event.domain_display_name.trim().length > 0
            ? event.domain_display_name.trim()
            : undefined,
      },
    );
  };

  const sendMessage = () => {
    const userContent = inputText.trim();
    if (!userContent || isStreaming) {
      return;
    }

    setChatError(null);
    setInputText('');

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: userContent,
      createdAt: Date.now(),
      status: 'done',
    };
    const assistantMessage: ChatMessage = {
      id: createMessageId('assistant'),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      status: 'streaming',
    };

    const nextConversation = normalizeConversation([...messages, userMessage]);
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsStreaming(true);
    setAssistantProgressByMessageId((current) => ({
      ...current,
      [assistantMessage.id]: createEmptyAssistantProgressState(FALLBACK_AGENT_LABEL, true),
    }));
    activeAssistantIdRef.current = assistantMessage.id;

    const stream = startChatCompletionStream(
      {
        model,
        messages: nextConversation,
      },
      {
        onToken: (token) => {
          setMessages((current) =>
            current.map((message) => {
              if (message.id !== activeAssistantIdRef.current) {
                return message;
              }
              return { ...message, content: `${message.content}${token}` };
            }),
          );
        },
        onDone: () => {
          const assistantId = activeAssistantIdRef.current;
          setMessages((current) =>
            current.map((message) => {
              if (message.id !== assistantId || message.status !== 'streaming') {
                return message;
              }
              return { ...message, status: 'done' };
            }),
          );
          setIsStreaming(false);
          if (assistantId) {
            finalizeMessageProgress(assistantId);
          }
          streamAbortRef.current = null;
          activeAssistantIdRef.current = null;
        },
        onError: (message) => {
          const assistantId = activeAssistantIdRef.current;
          setChatError(message);
          setMessages((current) => {
            if (!assistantId) {
              return current;
            }
            return current.flatMap((entry) => {
              if (entry.id !== assistantId) {
                return [entry];
              }
              if (entry.content.trim().length === 0) {
                return [];
              }
              return [{ ...entry, status: 'error' as const }];
            });
          });
          setIsStreaming(false);
          if (assistantId) {
            finalizeMessageProgress(assistantId);
          }
          streamAbortRef.current = null;
          activeAssistantIdRef.current = null;
        },
        onProgress: handleProgressEvent,
      },
    );

    streamAbortRef.current = stream.controller;
    void stream.done;
  };

  return {
    model,
    inputText,
    messages,
    isStreaming,
    chatError,
    availableModels,
    isLoadingModels,
    modelsError,
    assistantProgressByMessageId,
    canSend,
    setModel,
    setInputText,
    sendMessage,
    stopStreaming,
    clearConversation,
  };
}

export type ChatSessionState = ReturnType<typeof useChatSession>;
