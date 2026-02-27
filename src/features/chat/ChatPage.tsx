import { useEffect, useRef, useState } from 'react';

import { Button, Inline, Stack, Surface, Text } from '../../components/primitives';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { ChatSessionState } from './useChatSession';

interface ChatPageProps {
  session: ChatSessionState;
}

function ProgressToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {expanded ? <path d="M6 14l6-6 6 6" /> : <path d="M6 10l6 6 6-6" />}
    </svg>
  );
}

export function ChatPage({ session }: ChatPageProps) {
  const endOfTranscriptRef = useRef<HTMLDivElement | null>(null);
  const [collapsedProgressMessageIds, setCollapsedProgressMessageIds] = useState<Set<string>>(new Set());
  const pageClassName = session.chatError ? 'chat-page chat-page--with-error' : 'chat-page';

  const toggleProgressDetails = (messageId: string) => {
    setCollapsedProgressMessageIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (endOfTranscriptRef.current && typeof endOfTranscriptRef.current.scrollIntoView === 'function') {
      endOfTranscriptRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [session.messages]);

  return (
    <Stack gap={16} className={pageClassName}>
      <Inline justify="between" align="center" wrap gap={12}>
        <Stack gap={4}>
          <Text as="h2" variant="h2" weight="bold">
            Chat
          </Text>
          <Text tone="muted">Chat with agents using streamed responses.</Text>
        </Stack>
        <Inline className="chat-page__header-actions" gap={8}>
          <Button type="button" variant="secondary" onClick={session.clearConversation}>
            Clear chat
          </Button>
        </Inline>
      </Inline>

      {session.chatError ? (
        <Surface as="section" className="chat-error" padding={16}>
          <Text weight="bold">{session.chatError}</Text>
        </Surface>
      ) : null}

      <Surface as="section" className="chat-transcript" padding={16}>
        <Stack gap={12}>
          {session.messages.length === 0 ? (
            <Text tone="muted">No messages yet. Start by sending a prompt.</Text>
          ) : (
            session.messages.map((message) => {
              const showStreamingIndicator = message.status === 'streaming';
              const messageProgress = session.assistantProgressByMessageId[message.id];
              const hasHistory = (messageProgress?.history.length ?? 0) > 0;
              const showProgress = message.role === 'assistant' && (showStreamingIndicator || hasHistory);
              const latestHistoryEntry = messageProgress?.history.at(-1);
              const currentSpecialistLabel = latestHistoryEntry?.specialistName ?? messageProgress?.agentLabel ?? 'Thinking';
              const progressExpanded = !collapsedProgressMessageIds.has(message.id);
              const progressDetailsId = `chat-progress-details-${message.id}`;

              return (
                <div key={message.id} className={`chat-message chat-message--${message.role}`}>
                  <Text as="h3" variant="small" weight="bold">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </Text>
                  {message.role === 'assistant' ? (
                    <MarkdownRenderer content={message.content || ''} className="chat-message__content chat-message__content--markdown" />
                  ) : (
                    <Text className="chat-message__content">{message.content || ''}</Text>
                  )}
                  {showStreamingIndicator || showProgress ? (
                    <Stack gap={8} className="chat-progress">
                      {showStreamingIndicator ? (
                        <div className="chat-loading-bar" role="status" aria-label="Generating response">
                          <div className="chat-loading-bar__track">
                            <div className="chat-loading-bar__indicator" />
                          </div>
                        </div>
                      ) : null}
                      {showStreamingIndicator ? (
                        <Text variant="small" tone="muted" className="chat-streaming-indicator">
                          Streaming...
                        </Text>
                      ) : null}
                      <Inline justify="between" align="center" gap={8} className="chat-progress__header">
                        <Text variant="small" className="chat-progress__agent">
                          Agent: {currentSpecialistLabel}
                          {messageProgress?.isAgentLoading && showStreamingIndicator ? '...' : ''}
                        </Text>
                        <button
                          type="button"
                          className="chat-progress__toggle"
                          onClick={() => toggleProgressDetails(message.id)}
                          aria-expanded={progressExpanded}
                          aria-controls={progressDetailsId}
                          aria-label={progressExpanded ? 'Collapse progress details' : 'Expand progress details'}
                          title={progressExpanded ? 'Collapse progress details' : 'Expand progress details'}
                        >
                          <ProgressToggleIcon expanded={progressExpanded} />
                        </button>
                      </Inline>
                      {progressExpanded ? (
                        <div className="chat-progress__history" id={progressDetailsId}>
                          {!messageProgress || messageProgress.history.length === 0 ? (
                            <Text variant="small" tone="muted">
                              Tool calls: waiting...
                            </Text>
                          ) : (
                            <Stack gap={8}>
                              {messageProgress.history.map((agent) => (
                                <div
                                  key={`${message.id}-${agent.agentName}-${agent.startedAt}`}
                                  className="chat-progress__agent-section"
                                >
                                  <Text variant="small" className="chat-progress__agent-title">
                                    {agent.specialistName ?? agent.agentName}
                                    {agent.domainDisplayName || agent.domainKey ? (
                                      <span className="chat-progress__agent-domain">
                                        {' '}
                                        · {agent.domainDisplayName ?? agent.domainKey}
                                      </span>
                                    ) : null}
                                  </Text>
                                  <div className="chat-progress__agent-tools">
                                    {agent.tools.length === 0 ? (
                                      <Text variant="small" tone="muted">
                                        No tool calls
                                      </Text>
                                    ) : (
                                      <Stack gap={4}>
                                        {agent.tools.map((tool) => (
                                          <Inline
                                            key={`${tool.toolName}-${tool.startedAt}`}
                                            justify="between"
                                            align="center"
                                            gap={8}
                                          >
                                            <Text variant="small" className="chat-progress__tool">
                                              {tool.toolName}
                                            </Text>
                                            <span
                                              className={`chat-progress__status chat-progress__status--${tool.status}`}
                                              aria-label={`tool ${tool.toolName} ${tool.status}`}
                                            >
                                              {tool.status}
                                            </span>
                                          </Inline>
                                        ))}
                                      </Stack>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </Stack>
                          )}
                        </div>
                      ) : null}
                    </Stack>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={endOfTranscriptRef} />
        </Stack>
      </Surface>

      <Surface as="section" className="chat-composer" padding={16}>
        <Stack gap={12}>
          <label className="field-label">
            Message
            <textarea
              className="field-input chat-composer__textarea"
              value={session.inputText}
              onChange={(event) => session.setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  session.sendMessage();
                }
              }}
              placeholder="Ask something..."
              rows={5}
            />
          </label>
          <Inline gap={12} align="end" wrap className="chat-composer__top">
            <label className="field-label chat-composer__model">
              Model
              <select
                className="field-input"
                value={session.model}
                onChange={(event) => session.setModel(event.target.value)}
                disabled={session.isLoadingModels || session.availableModels.length === 0}
              >
                {session.availableModels.length === 0 ? (
                  <option value="">{session.isLoadingModels ? 'Loading models...' : 'No models available'}</option>
                ) : null}
                {session.availableModels.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id}
                  </option>
                ))}
              </select>
            </label>
            <Inline className="chat-composer__actions" gap={12} justify="end">
              {session.isStreaming ? (
                <Button type="button" variant="secondary" onClick={session.stopStreaming}>
                  Stop
                </Button>
              ) : (
                <Button type="button" variant="primary" onClick={session.sendMessage} disabled={!session.canSend}>
                  Send
                </Button>
              )}
            </Inline>
          </Inline>
          {session.modelsError ? (
            <Text tone="danger" variant="small">
              {session.modelsError}
            </Text>
          ) : null}
        </Stack>
      </Surface>
    </Stack>
  );
}
