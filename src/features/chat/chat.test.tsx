import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatPage } from './ChatPage';
import { useChatSession } from './useChatSession';

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

function ChatHarness() {
  const session = useChatSession();
  return <ChatPage session={session} />;
}

function mockChatFetch(options?: { chatResponse?: Response; modelsResponse?: Response; hangChat?: boolean }) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/v1/models')) {
      return Promise.resolve(
        options?.modelsResponse ??
          new Response(
            JSON.stringify({
              object: 'list',
              data: [{ id: 'gpt-4.1-mini' }],
            }),
            { status: 200 },
          ),
      );
    }
    if (url.includes('/v1/chat/completions')) {
      if (options?.hangChat) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }
      if (options?.chatResponse) {
        return Promise.resolve(options.chatResponse);
      }
      return Promise.resolve(
        createSseResponse(['data: {"choices":[{"delta":{"content":"ok"}}]}\n\n', 'data: [DONE]\n\n']),
      );
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
}

describe('ChatPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a message and streams assistant response', async () => {
    mockChatFetch({
      chatResponse: createSseResponse([
        'event: progress\ndata: {"type":"agent_stage","timestamp":1,"agent":"Orchestrator","stage":"started","specialist_name":"Orchestrator","domain_key":"routing","domain_display_name":"Routing"}\n\n',
        'event: progress\ndata: {"type":"agent_stage","timestamp":2,"agent":"GeoAgent","stage":"started","specialist_name":"GeoAgent","domain_key":"geo","domain_display_name":"Geo Intelligence"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":2,"agent":"GeoAgent","tool_name":"geo_show_map","specialist_name":"GeoAgent","domain_key":"geo","domain_display_name":"Geo Intelligence"}\n\n',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'event: progress\ndata: {"type":"tool_end","timestamp":3,"agent":"GeoAgent","tool_name":"geo_show_map","status":"done","specialist_name":"GeoAgent","domain_key":"geo","domain_display_name":"Geo Intelligence"}\n\n',
        'data: {"choices":[{"delta":{"content":" from chat"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('You')).toBeInTheDocument();
    expect(await screen.findByText('Assistant')).toBeInTheDocument();
    expect(await screen.findByText(/agent:\s*geoagent/i)).toBeInTheDocument();
    expect(
      (
        await screen.findAllByText((_, node) => {
          const text = node?.textContent ?? '';
          return text.includes('GeoAgent') && text.includes('Geo Intelligence');
        })
      ).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText('geo_show_map')).toBeInTheDocument();
    expect(await screen.findByLabelText(/tool geo_show_map done/i)).toBeInTheDocument();
    await screen.findByText('Hello from chat');
    await waitFor(() => {
      expect(screen.queryByLabelText(/generating response/i)).not.toBeInTheDocument();
    });
  });

  it('shows Stop while streaming and aborts active request', async () => {
    const fetchMock = mockChatFetch({ hangChat: true });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'stop this' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByLabelText(/generating response/i)).toBeInTheDocument();
    const stopButton = await screen.findByRole('button', { name: /stop/i });
    expect(stopButton.closest('.chat-composer__top')).not.toBeNull();
    expect(stopButton).toBeInTheDocument();
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/generating response/i)).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalled();
  });

  it('keeps Agent label agent-only when tool starts before specialist stage', async () => {
    mockChatFetch({
      chatResponse: createSseResponse([
        'event: progress\ndata: {"type":"agent_stage","timestamp":1,"agent":"Orchestrator","stage":"started"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":2,"agent":"GeoAgent","tool_name":"geo_show_map"}\n\n',
        'data: {"choices":[{"delta":{"content":"Working"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Show map' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/agent:\s*orchestrator/i)).toBeInTheDocument();
    expect(await screen.findByText('geo_show_map')).toBeInTheDocument();
    expect(screen.queryByText(/agent:\s*geo_show_map/i)).not.toBeInTheDocument();
  });

  it('sends model when provided and supports clearing conversation', async () => {
    const fetchMock = mockChatFetch({
      modelsResponse: new Response(
        JSON.stringify({
          object: 'list',
          data: [{ id: 'gpt-4.1-mini' }, { id: 'gpt-4.1' }],
        }),
        { status: 200 },
      ),
      chatResponse: createSseResponse(['data: {"choices":[{"delta":{"content":"ok"}}]}\n\n', 'data: [DONE]\n\n']),
    });

    render(<ChatHarness />);

    const modelSelect = await screen.findByLabelText(/^model$/i);
    const clearChatButton = screen.getByRole('button', { name: /clear chat/i });
    const composerActionsRow = modelSelect.closest('.chat-composer__top');
    expect(clearChatButton.closest('.chat-page__header-actions')).not.toBeNull();
    expect(composerActionsRow).not.toBeNull();
    expect(screen.getByRole('button', { name: /^send$/i }).closest('.chat-composer__top')).toBe(composerActionsRow);

    fireEvent.change(modelSelect, { target: { value: 'gpt-4.1' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hi with model' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await screen.findByText('ok');

    const [modelsUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(modelsUrl).toContain('/v1/models');
    const [, chatInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(typeof chatInit.body).toBe('string');
    const body = JSON.parse(chatInit.body as string) as { model?: string };
    expect(body.model).toBe('gpt-4.1');

    fireEvent.click(screen.getByRole('button', { name: /clear chat/i }));
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('renders backend error message when request fails', async () => {
    mockChatFetch({
      chatResponse: new Response(
        JSON.stringify({
          error: {
            message: 'The last message must have role=user',
            type: 'invalid_request_error',
            code: 'invalid_request_error',
          },
        }),
        { status: 400 },
      ),
    });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    expect(await screen.findByText(/the last message must have role=user/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByLabelText(/generating response/i)).not.toBeInTheDocument();
    });
  });

  it('allows collapsing and expanding progress details', async () => {
    mockChatFetch({
      chatResponse: createSseResponse([
        'event: progress\ndata: {"type":"agent_stage","timestamp":1,"agent":"Presenter","stage":"started"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":2,"agent":"Presenter","tool_name":"db_list_tables"}\n\n',
        'event: progress\ndata: {"type":"tool_end","timestamp":3,"agent":"Presenter","tool_name":"db_list_tables","status":"done"}\n\n',
        'data: {"choices":[{"delta":{"content":"Done"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'list db tables' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    const collapseButton = await screen.findByRole('button', { name: /collapse progress details/i });
    expect(await screen.findByText('db_list_tables')).toBeInTheDocument();

    fireEvent.click(collapseButton);
    expect(await screen.findByRole('button', { name: /expand progress details/i })).toBeInTheDocument();
    expect(screen.queryByText('db_list_tables')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /expand progress details/i }));
    expect(await screen.findByText('db_list_tables')).toBeInTheDocument();
  });

  it('keeps per-message agent history when newer responses are added', async () => {
    const firstResponse = createSseResponse([
      'event: progress\ndata: {"type":"agent_stage","timestamp":1,"agent":"Presenter","stage":"started"}\n\n',
      'event: progress\ndata: {"type":"tool_start","timestamp":2,"agent":"Presenter","tool_name":"db_list_tables"}\n\n',
      'event: progress\ndata: {"type":"tool_end","timestamp":3,"agent":"Presenter","tool_name":"db_list_tables","status":"done"}\n\n',
      'data: {"choices":[{"delta":{"content":"First"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const secondResponse = createSseResponse([
      'event: progress\ndata: {"type":"agent_stage","timestamp":4,"agent":"Analyst","stage":"started"}\n\n',
      'event: progress\ndata: {"type":"tool_start","timestamp":5,"agent":"Analyst","tool_name":"db_query_table"}\n\n',
      'event: progress\ndata: {"type":"tool_end","timestamp":6,"agent":"Analyst","tool_name":"db_query_table","status":"done"}\n\n',
      'data: {"choices":[{"delta":{"content":"Second"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);

    let chatCallIndex = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/v1/models')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              object: 'list',
              data: [{ id: 'gpt-4.1-mini' }],
            }),
            { status: 200 },
          ),
        );
      }
      if (url.includes('/v1/chat/completions')) {
        chatCallIndex += 1;
        return Promise.resolve(chatCallIndex === 1 ? firstResponse : secondResponse);
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'first' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
    await screen.findByText('First');

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'second' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
    await screen.findByText('Second');

    expect(screen.getByText('db_list_tables')).toBeInTheDocument();
    expect(screen.getByText('db_query_table')).toBeInTheDocument();
    expect(screen.getByText('Presenter')).toBeInTheDocument();
    expect(screen.getByText('Analyst')).toBeInTheDocument();
  });

  it('groups tools under each agent section in chronological order', async () => {
    mockChatFetch({
      chatResponse: createSseResponse([
        'event: progress\ndata: {"type":"agent_stage","timestamp":1,"agent":"Orchestrator","stage":"started"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":2,"agent":"Orchestrator","tool_name":"planner_select"}\n\n',
        'event: progress\ndata: {"type":"tool_end","timestamp":3,"agent":"Orchestrator","tool_name":"planner_select","status":"done"}\n\n',
        'event: progress\ndata: {"type":"agent_stage","timestamp":4,"agent":"GeoAgent","stage":"started"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":5,"agent":"GeoAgent","tool_name":"geo_show_map"}\n\n',
        'event: progress\ndata: {"type":"tool_end","timestamp":6,"agent":"GeoAgent","tool_name":"geo_show_map","status":"done"}\n\n',
        'event: progress\ndata: {"type":"agent_stage","timestamp":7,"agent":"SqlAgent","stage":"started"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":8,"agent":"SqlAgent","tool_name":"db_query_table"}\n\n',
        'event: progress\ndata: {"type":"tool_end","timestamp":9,"agent":"SqlAgent","tool_name":"db_query_table","status":"done"}\n\n',
        'data: {"choices":[{"delta":{"content":"Complete"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'run multi agent flow' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await screen.findByText('Complete');
    expect(screen.getByText('Orchestrator')).toBeInTheDocument();
    expect(screen.getByText('GeoAgent')).toBeInTheDocument();
    expect(screen.getByText('SqlAgent')).toBeInTheDocument();
    expect(screen.getByText('planner_select')).toBeInTheDocument();
    expect(screen.getByText('geo_show_map')).toBeInTheDocument();
    expect(screen.getByText('db_query_table')).toBeInTheDocument();
  });

  it('falls back to domain key when domain display name is missing', async () => {
    mockChatFetch({
      chatResponse: createSseResponse([
        'event: progress\ndata: {"type":"agent_stage","timestamp":1,"agent":"SqlAgent","stage":"started","specialist_name":"SqlAgent","domain_key":"sql"}\n\n',
        'event: progress\ndata: {"type":"tool_start","timestamp":2,"agent":"SqlAgent","tool_name":"db_query_table","specialist_name":"SqlAgent","domain_key":"sql"}\n\n',
        'event: progress\ndata: {"type":"tool_end","timestamp":3,"agent":"SqlAgent","tool_name":"db_query_table","status":"done","specialist_name":"SqlAgent","domain_key":"sql"}\n\n',
        'data: {"choices":[{"delta":{"content":"Done"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    });

    render(<ChatHarness />);
    expect(await screen.findByLabelText(/^model$/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'query sql' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await screen.findByText('Done');
    expect(
      screen
        .getAllByText((_, node) => {
        const text = node?.textContent ?? '';
        return text.includes('SqlAgent') && text.includes('sql');
        }).length,
    ).toBeGreaterThan(0);
  });
});
