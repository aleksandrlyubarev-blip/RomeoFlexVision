import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';
import type { ClientBoundMessage } from '../src/types.js';

// ---------------------------------------------------------------------------
// Fake xAI realtime server: accepts session.update, then drives one scripted
// turn — a function call, transcripts, audio, a barge-in, and response.done.
// GROK_REALTIME_URL must be set before grok-session.ts is imported (the
// module reads it at load time), hence the dynamic import below.
// ---------------------------------------------------------------------------

const received: any[] = [];
let sessionUpdatePayload: any;
let connectionAuth: string | undefined;
let connectionUrl: string | undefined;

const wss = new WebSocketServer({ port: 0 });
const port = (wss.address() as AddressInfo).port;
process.env.GROK_REALTIME_URL = `ws://localhost:${port}/v1/realtime`;

wss.on('connection', (ws: WebSocket, req) => {
  connectionAuth = req.headers.authorization;
  connectionUrl = req.url ?? '';

  ws.on('message', (raw) => {
    const event = JSON.parse(raw.toString());
    received.push(event);

    if (event.type === 'session.update') {
      sessionUpdatePayload = event.session;
      ws.send(JSON.stringify({ type: 'session.updated', session: event.session }));

      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'response.created' }));
        ws.send(
          JSON.stringify({
            type: 'response.function_call_arguments.done',
            name: 'get_inspection_stats',
            call_id: 'call_1',
            arguments: JSON.stringify({ line_id: 'line-1' }),
          }),
        );
      }, 20);
    }

    if (event.type === 'response.create') {
      ws.send(JSON.stringify({ type: 'response.output_audio_transcript.delta', delta: 'Line one is at ' }));
      ws.send(
        JSON.stringify({
          type: 'response.output_audio.delta',
          audio: Buffer.from([1, 2, 3, 4]).toString('base64'),
        }),
      );
      ws.send(JSON.stringify({ type: 'input_audio_buffer.speech_started' })); // barge-in
      ws.send(
        JSON.stringify({
          type: 'response.output_audio_transcript.done',
          transcript: 'Line one is at ninety-two point one percent.',
        }),
      );
      ws.send(JSON.stringify({ type: 'response.done' }));
    }
  });
});

// ---------------------------------------------------------------------------
// One full scripted conversation, then assertions over the recorded traffic
// ---------------------------------------------------------------------------

const emitted: Array<ClientBoundMessage | { type: 'audio'; bytes: number }> = [];
const errors: Error[] = [];

before(async () => {
  const { GrokSession } = await import('../src/grok-session.js');
  const session = new GrokSession('test-key', 'grok-voice-latest', 'rex');
  session.on('message', (m: ClientBoundMessage) => emitted.push(m));
  session.on('audio', (buf: Buffer) => emitted.push({ type: 'audio', bytes: buf.length }));
  session.on('error', (e: Error) => errors.push(e));

  await session.connect();
  session.sendAudio(Buffer.from([9, 9, 9, 9]));

  // Let the scripted turn play out
  await new Promise((resolve) => setTimeout(resolve, 300));
  session.close();
});

after(() => wss.close());

test('connects with bearer auth and model query param', () => {
  assert.equal(connectionAuth, 'Bearer test-key');
  assert.match(connectionUrl ?? '', /model=grok-voice-latest/);
});

test('session.update carries instructions, VAD, and the four function tools', () => {
  assert.match(sessionUpdatePayload.instructions, /You are Romeo/);
  assert.equal(sessionUpdatePayload.turn_detection.type, 'server_vad');
  assert.equal(sessionUpdatePayload.tools.length, 4);
  assert.ok(sessionUpdatePayload.tools.every((t: { type: string }) => t.type === 'function'));
});

test('connect() resolves once the session is ready', () => {
  assert.ok(emitted.some((m) => m.type === 'status' && m.state === 'ready'));
});

test('browser audio is forwarded as input_audio_buffer.append', () => {
  const append = received.find((e) => e.type === 'input_audio_buffer.append');
  assert.ok(append);
  assert.equal(Buffer.from(append.audio, 'base64').length, 4);
});

test('function call round trip: executed locally, output returned, response requested', () => {
  assert.ok(emitted.some((m) => m.type === 'tool_call' && m.name === 'get_inspection_stats'));
  const toolResult = emitted.find((m) => m.type === 'tool_result');
  assert.ok(toolResult && 'data' in toolResult);
  assert.equal((toolResult.data as Record<string, unknown>).pass_rate, 92.1);

  const output = received.find(
    (e) => e.type === 'conversation.item.create' && e.item?.type === 'function_call_output',
  );
  assert.equal(output?.item.call_id, 'call_1');
  assert.equal(JSON.parse(output.item.output).line_id, 'line-1');
  assert.ok(received.some((e) => e.type === 'response.create'));
});

test('audio deltas are emitted as raw buffers', () => {
  assert.ok(emitted.some((m) => m.type === 'audio' && m.bytes === 4));
});

test('model transcripts stream as deltas and finalize', () => {
  assert.ok(
    emitted.some((m) => m.type === 'transcript' && m.role === 'model' && m.final === false),
  );
  const final = emitted.find((m) => m.type === 'transcript' && m.final === true);
  assert.ok(final && 'text' in final);
  assert.match(final.text, /ninety-two/);
});

test('barge-in while speaking returns the session to listening', () => {
  assert.ok(emitted.some((m) => m.type === 'status' && m.state === 'listening'));
});

test('response.done returns the session to ready and no errors were emitted', () => {
  const readies = emitted.filter((m) => m.type === 'status' && m.state === 'ready');
  assert.ok(readies.length >= 2);
  assert.deepEqual(errors, []);
});
