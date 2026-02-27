import { afterEach, describe, expect, it, vi } from 'vitest';

import { listChatModels, startChatCompletionStream } from './api';

function createSseResponse(events: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status,
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
}

describe('chat api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('streams token chunks and completes on [DONE]', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseResponse([
        'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );

    const tokens: string[] = [];
    const onDone = vi.fn();
    const onError = vi.fn();
    const stream = startChatCompletionStream(
      {
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: 'Hi' }],
      },
      {
        onToken: (token) => tokens.push(token),
        onDone,
        onError,
      },
    );

    await stream.done;

    expect(tokens.join('')).toBe('Hello world');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(typeof init.body).toBe('string');
    const body = JSON.parse(init.body as string) as { include_progress?: boolean };
    expect(body.include_progress).toBe(true);
  });

  it('parses backend error envelope on non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'Invalid request body',
            type: 'invalid_request_error',
            code: 'invalid_request_error',
          },
        }),
        { status: 400 },
      ),
    );

    const onDone = vi.fn();
    const onError = vi.fn();
    const stream = startChatCompletionStream(
      {
        model: '',
        messages: [{ role: 'user', content: 'Hi' }],
      },
      {
        onToken: vi.fn(),
        onDone,
        onError,
      },
    );

    await stream.done;

    expect(onError).toHaveBeenCalledWith('Invalid request body');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('supports abort without raising handler error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseResponse([
        'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" response"}}]}\n\n',
      ]),
    );

    const onError = vi.fn();
    const stream = startChatCompletionStream(
      {
        model: '',
        messages: [{ role: 'user', content: 'Hi' }],
      },
      {
        onToken: vi.fn(),
        onDone: vi.fn(),
        onError,
      },
    );

    stream.controller.abort();
    await stream.done;

    expect(onError).not.toHaveBeenCalled();
  });

  it('parses progress events alongside content chunks', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSseResponse([
        'event: progress\ndata: {"type":"agent_stage","timestamp":1,"agent":"Orchestrator","stage":"started","specialist_name":"GeoAgent","domain_key":"geo","domain_display_name":"Geo Intelligence"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":2,"agent":"GeoAgent","tool_name":"geo_show_map","specialist_name":"GeoAgent","domain_key":"geo","domain_display_name":"Geo Intelligence"}\n\n',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'event: progress\ndata: {"type":"tool_end","timestamp":3,"agent":"GeoAgent","tool_name":"geo_show_map","status":"done","specialist_name":"GeoAgent","domain_key":"geo","domain_display_name":"Geo Intelligence"}\n\n',
        'data: [DONE]\n\n',
      ]),
    );

    const progressTypes: string[] = [];
    const progressEvents: unknown[] = [];
    const stream = startChatCompletionStream(
      {
        model: '',
        messages: [{ role: 'user', content: 'Hi' }],
      },
      {
        onToken: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
        onProgress: (event) => {
          progressTypes.push(event.type);
          progressEvents.push(event);
        },
      },
    );

    await stream.done;
    expect(progressTypes).toEqual(['agent_stage', 'tool_start', 'tool_end']);
    expect(progressEvents[0]).toMatchObject({
      specialist_name: 'GeoAgent',
      domain_key: 'geo',
      domain_display_name: 'Geo Intelligence',
    });
  });

  it('lists available models from /v1/models', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          object: 'list',
          data: [
            { id: 'gpt-4.1-mini', object: 'model' },
            { id: 'gpt-4.1', object: 'model' },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await listChatModels();
    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ id: 'gpt-4.1-mini' }, { id: 'gpt-4.1' }]);
  });

  it('returns backend error message when models endpoint fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'Model registry is not available',
            code: 'internal_error',
          },
        }),
        { status: 500 },
      ),
    );

    const result = await listChatModels();
    expect(result.data).toBeNull();
    expect(result.error).toBe('Model registry is not available');
  });
});
