const EventEmitter = require('events');
const { CallRuntime } = require('../../../src/runtime/core/CallRuntime');

function createWs() {
  const handlers = {};
  return {
    handlers,
    sent: [],
    on: (event, cb) => { handlers[event] = cb; },
    send: (payload) => { handlers.__sent = handlers.__sent || []; handlers.__sent.push(payload); },
  };
}

describe('CallRuntime', () => {
  test('start event initializes stream and persists started state', async () => {
    const ws = createWs();
    const transcriptionService = new EventEmitter();
    transcriptionService.send = jest.fn();
    const gptService = new EventEmitter();
    gptService.setCallSid = jest.fn();
    gptService.completion = jest.fn();
    const streamService = new EventEmitter();
    streamService.setStreamSid = jest.fn();
    streamService.buffer = jest.fn();
    const ttsService = new EventEmitter();
    ttsService.generate = jest.fn();
    const sessionStore = { setSessionValue: jest.fn().mockResolvedValue() };

    const runtime = new CallRuntime(ws, {
      transcriptionService,
      gptService,
      streamService,
      ttsService,
      sessionStore,
      recordingService: jest.fn().mockResolvedValue(),
    });

    await runtime.initialize();
    await runtime.handleIncomingMessage({ event: 'start', start: { streamSid: 'stream-1', callSid: 'call-1' } });

    expect(streamService.setStreamSid).toHaveBeenCalledWith('stream-1');
    expect(gptService.setCallSid).toHaveBeenCalledWith('call-1');
    expect(sessionStore.setSessionValue).toHaveBeenCalledWith('call-1', expect.objectContaining({ status: 'started' }), 3600);
  });

  test('transcription drives GPT completion and active state persistence', async () => {
    const ws = createWs();
    const transcriptionService = new EventEmitter();
    transcriptionService.send = jest.fn();
    const gptService = new EventEmitter();
    gptService.setCallSid = jest.fn();
    gptService.completion = jest.fn().mockResolvedValue();
    const streamService = new EventEmitter();
    streamService.setStreamSid = jest.fn();
    streamService.buffer = jest.fn();
    const ttsService = new EventEmitter();
    ttsService.generate = jest.fn();
    const sessionStore = { setSessionValue: jest.fn().mockResolvedValue() };

    const runtime = new CallRuntime(ws, {
      transcriptionService,
      gptService,
      streamService,
      ttsService,
      sessionStore,
      recordingService: jest.fn().mockResolvedValue(),
    });

    await runtime.initialize();
    runtime.callSid = 'call-2';
    runtime.streamSid = 'stream-2';

    await transcriptionService.emit('transcription', 'hello there');

    expect(gptService.completion).toHaveBeenCalledWith('hello there', 0);
    expect(sessionStore.setSessionValue).toHaveBeenCalledWith('call-2', expect.objectContaining({ status: 'active', interactionCount: 1 }), 3600);
  });
});
