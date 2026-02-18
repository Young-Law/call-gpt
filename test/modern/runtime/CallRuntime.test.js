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

  test('start flow is resilient when recording setup fails', async () => {
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
    const recordingError = new Error('twilio down');
    const recordingService = jest.fn().mockRejectedValue(recordingError);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const runtime = new CallRuntime(ws, {
      transcriptionService,
      gptService,
      streamService,
      ttsService,
      sessionStore,
      recordingService,
    });

    await runtime.initialize();
    await runtime.handleIncomingMessage({ event: 'start', start: { streamSid: 'stream-1', callSid: 'call-1' } });
    await new Promise((resolve) => setImmediate(resolve));

    expect(ttsService.generate).toHaveBeenCalledWith(expect.objectContaining({
      partialResponse: expect.stringContaining('Hello, and thank you for calling'),
    }), 0);
    expect(recordingService).toHaveBeenCalledWith(ttsService, 'call-1');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Recording setup failed:', 'twilio down');

    consoleErrorSpy.mockRestore();
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

    transcriptionService.emit('transcription', 'hello there');
    await new Promise((resolve) => setImmediate(resolve));

    expect(gptService.completion).toHaveBeenCalledWith('hello there', 0);
    expect(sessionStore.setSessionValue).toHaveBeenCalledWith('call-2', expect.objectContaining({ status: 'active', interactionCount: 1 }), 3600);
  });

  test('transcription callback isolates completion errors', async () => {
    const ws = createWs();
    const transcriptionService = new EventEmitter();
    transcriptionService.send = jest.fn();
    const gptService = new EventEmitter();
    gptService.setCallSid = jest.fn();
    gptService.completion = jest.fn().mockRejectedValue(new Error('openai timeout'));
    const streamService = new EventEmitter();
    streamService.setStreamSid = jest.fn();
    streamService.buffer = jest.fn();
    const ttsService = new EventEmitter();
    ttsService.generate = jest.fn();
    const sessionStore = { setSessionValue: jest.fn().mockResolvedValue() };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const runtime = new CallRuntime(ws, {
      transcriptionService,
      gptService,
      streamService,
      ttsService,
      sessionStore,
      recordingService: jest.fn().mockResolvedValue(),
    });

    await runtime.initialize();
    transcriptionService.emit('transcription', 'hello there');
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error handling transcription event:', 'openai timeout');
    expect(sessionStore.setSessionValue).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: 'active' }), 3600);

    consoleErrorSpy.mockRestore();
  });

  test('gptreply callback isolates TTS errors', async () => {
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
    ttsService.generate = jest.fn().mockRejectedValue(new Error('tts outage'));
    const sessionStore = { setSessionValue: jest.fn().mockResolvedValue() };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const runtime = new CallRuntime(ws, {
      transcriptionService,
      gptService,
      streamService,
      ttsService,
      sessionStore,
      recordingService: jest.fn().mockResolvedValue(),
    });

    await runtime.initialize();
    gptService.emit('gptreply', { partialResponse: 'hi', partialResponseIndex: 0 }, 1);
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error handling gptreply event:', 'tts outage');

    consoleErrorSpy.mockRestore();
  });
});
