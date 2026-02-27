import { getEnv } from '../../lib/env';
import type { ChatApiErrorPayload, ChatModelInfo, ChatProgressEvent, ChatRequestInput } from './types';

const CHAT_DEBUG = import.meta.env.DEV;

function logChatDebug(message: string, details?: Record<string, unknown>) {
  if (!CHAT_DEBUG) {
    return;
  }
  if (details) {
    console.debug(message, details);
    return;
  }
  console.debug(message);
}

function previewText(text: string, limit = 120): string {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}...`;
}

interface StartChatCompletionStreamHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
  onProgress?: (event: ChatProgressEvent) => void;
}

interface StartChatCompletionStreamResult {
  controller: AbortController;
  done: Promise<void>;
}

interface ListModelsResult {
  data: ChatModelInfo[] | null;
  error: string | null;
}

function extractModels(payload: unknown): ChatModelInfo[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  if (!('data' in payload)) {
    return [];
  }
  const rawData = (payload as { data?: unknown }).data;
  if (!Array.isArray(rawData)) {
    return [];
  }
  return rawData
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const id = (item as { id?: unknown }).id;
      if (typeof id !== 'string' || id.trim().length === 0) {
        return null;
      }
      return { id };
    })
    .filter((item): item is ChatModelInfo => item !== null);
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }
  const maybeError = (payload as ChatApiErrorPayload).error;
  if (maybeError?.message && maybeError.message.trim().length > 0) {
    return maybeError.message;
  }
  return fallback;
}

function processSseEventBlock(
  eventBlock: string,
  handlers: StartChatCompletionStreamHandlers,
): { keepReading: boolean; doneReceived: boolean } {
  const lines = eventBlock.split(/\r?\n/);
  let eventName = 'message';
  const dataParts: string[] = [];
  for (const line of lines) {
    if (line.startsWith('event:')) {
      const rawEventName = line.slice(6).trim();
      if (rawEventName) {
        eventName = rawEventName;
      }
      continue;
    }
    if (line.startsWith('data:')) {
      dataParts.push(line.slice(5).trimStart());
    }
  }
  const rawData = dataParts.join('\n').trim();
  logChatDebug('[chat-stream] event_block', {
    event: eventName,
    isDone: rawData === '[DONE]',
    rawLen: rawData.length,
    preview: previewText(rawData),
  });
  if (!rawData) {
    return { keepReading: true, doneReceived: false };
  }
  if (rawData === '[DONE]') {
    logChatDebug('[chat-stream] done_received');
    handlers.onDone();
    return { keepReading: false, doneReceived: true };
  }
  try {
    const parsed = JSON.parse(rawData) as unknown;
    if (eventName === 'progress') {
      const progress = parsed as Partial<ChatProgressEvent>;
      if (
        progress &&
        typeof progress === 'object' &&
        typeof progress.type === 'string' &&
        (progress.type === 'agent_stage' || progress.type === 'tool_start' || progress.type === 'tool_end')
      ) {
        logChatDebug('[chat-stream] progress', {
          type: progress.type,
          agent: 'agent' in progress ? progress.agent : undefined,
          stage: 'stage' in progress ? progress.stage : undefined,
          accepted: true,
        });
        handlers.onProgress?.(progress as ChatProgressEvent);
      } else {
        logChatDebug('[chat-stream] progress', {
          accepted: false,
        });
      }
      return { keepReading: true, doneReceived: false };
    }
    const chunk = parsed as { choices?: { delta?: { content?: string } }[] };
    const token = chunk.choices?.[0]?.delta?.content;
    if (typeof token === 'string' && token.length > 0) {
      logChatDebug('[chat-stream] token parsed', {
        len: token.length,
        preview: previewText(token),
      });
      handlers.onToken(token);
    } else {
      logChatDebug('[chat-stream] no_token_in_chunk');
    }
    return { keepReading: true, doneReceived: false };
  } catch {
    if (eventName === 'progress') {
      logChatDebug('[chat-stream] progress_parse_error_ignored', {
        preview: previewText(rawData),
      });
      return { keepReading: true, doneReceived: false };
    }
    logChatDebug('[chat-stream] parse_error', {
      event: eventName,
      preview: previewText(rawData),
    });
    handlers.onError('Invalid streaming payload received from chat endpoint.');
    return { keepReading: false, doneReceived: false };
  }
}

export function startChatCompletionStream(
  input: ChatRequestInput,
  handlers: StartChatCompletionStreamHandlers,
): StartChatCompletionStreamResult {
  const controller = new AbortController();
  const { apiBaseUrl } = getEnv();

  const done = (async () => {
    try {
      const payload: Record<string, unknown> = {
        messages: input.messages,
        stream: true,
        include_progress: true,
      };
      const model = input.model.trim();
      if (model) {
        payload.model = model;
      }

      const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        let parsedError: unknown = null;
        try {
          parsedError = await response.json();
        } catch {
          parsedError = null;
        }
        handlers.onError(getErrorMessage(parsedError, `Chat request failed with status ${response.status}.`));
        return;
      }

      if (!response.body) {
        handlers.onError('Streaming response body is missing.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let keepReading = true;
      let doneReceived = false;

      while (keepReading) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) {
          break;
        }
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let separatorIndex = buffer.indexOf('\n\n');
        while (separatorIndex >= 0 && keepReading) {
          const eventBlock = buffer.slice(0, separatorIndex).trim();
          buffer = buffer.slice(separatorIndex + 2);
          const processed = processSseEventBlock(eventBlock, handlers);
          keepReading = processed.keepReading;
          doneReceived = processed.doneReceived || doneReceived;
          separatorIndex = buffer.indexOf('\n\n');
        }
      }

      if (keepReading && !doneReceived) {
        handlers.onDone();
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      handlers.onError(error instanceof Error ? error.message : 'Unknown chat request error.');
    }
  })();

  return { controller, done };
}

export async function listChatModels(): Promise<ListModelsResult> {
  const { apiBaseUrl } = getEnv();

  try {
    const response = await fetch(`${apiBaseUrl}/v1/models`, {
      method: 'GET',
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      return {
        data: null,
        error: getErrorMessage(payload, `Models request failed with status ${response.status}.`),
      };
    }

    const models = extractModels(payload);

    return {
      data: models,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown models request error.',
    };
  }
}
