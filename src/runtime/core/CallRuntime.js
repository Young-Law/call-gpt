const { GptService } = require('../adapters/GptService');
const { StreamService } = require('../adapters/StreamService');
const { TranscriptionService } = require('../adapters/TranscriptionService');
const { TextToSpeechService } = require('../adapters/TtsService');
const { recordingService } = require('../adapters/recordingService');
const { RedisSessionStore } = require('../../state/RedisSessionStore');

class CallRuntime {
  constructor(ws, deps = {}) {
    this.ws = ws;
    this.streamSid = null;
    this.callSid = null;
    this.marks = [];
    this.interactionCount = 0;

    this.gptService = deps.gptService || new GptService();
    this.streamService = deps.streamService || new StreamService(ws);
    this.transcriptionService = deps.transcriptionService || new TranscriptionService();
    this.ttsService = deps.ttsService || new TextToSpeechService();
    this.sessionStore = deps.sessionStore || new RedisSessionStore();
    this.recordingService = deps.recordingService || recordingService;
  }

  async initialize() {
    this.ws.on('error', console.error);
    this.ws.on('message', async (data) => {
      try {
        await this.handleIncomingMessage(JSON.parse(data));
      } catch (error) {
        console.error('Error handling websocket message:', error.message);
      }
    });

    this.transcriptionService.on('utterance', async (text) => {
      try {
        if (this.marks.length > 0 && text?.length > 5) {
          this.ws.send(JSON.stringify({ streamSid: this.streamSid, event: 'clear' }));
        }
      } catch (error) {
        console.error('Error handling utterance event:', error.message);
      }
    });

    this.transcriptionService.on('transcription', async (text) => {
      try {
        if (!text) return;
        await this.gptService.completion(text, this.interactionCount);
        this.interactionCount += 1;
        await this.saveSessionState('active');
      } catch (error) {
        console.error('Error handling transcription event:', error.message);
      }
    });

    this.gptService.on('gptreply', async (gptReply, icount) => {
      try {
        await this.ttsService.generate(gptReply, icount);
      } catch (error) {
        console.error('Error handling gptreply event:', error.message);
      }
    });

    this.ttsService.on('speech', (responseIndex, audio) => {
      this.streamService.buffer(responseIndex, audio);
    });

    this.streamService.on('audiosent', (markLabel) => {
      this.marks.push(markLabel);
    });
  }

  async handleIncomingMessage(msg) {
    if (msg.event === 'start') return this.handleStart(msg);
    if (msg.event === 'media') return this.transcriptionService.send(msg.media.payload);
    if (msg.event === 'mark') {
      this.marks = this.marks.filter((mark) => mark !== msg.mark.name);
      return;
    }
    if (msg.event === 'stop') return this.saveSessionState('ended');
  }

  async handleStart(msg) {
    this.streamSid = msg.start.streamSid;
    this.callSid = msg.start.callSid;
    this.streamService.setStreamSid(this.streamSid);
    this.gptService.setCallSid(this.callSid);
    await this.saveSessionState('started');

    this.ttsService.generate({
      partialResponseIndex: null,
      partialResponse: 'Hello, and thank you for calling E Orum Young Law, LLC. How may we be of service to you today?',
    }, 0);

    Promise.resolve(this.recordingService(this.ttsService, this.callSid)).catch((error) => {
      console.error('Recording setup failed:', error.message);
    });
  }

  async saveSessionState(status) {
    await this.sessionStore.setSessionValue(this.callSid || this.streamSid, {
      callSid: this.callSid,
      streamSid: this.streamSid,
      status,
      interactionCount: this.interactionCount,
      updatedAt: new Date().toISOString(),
    }, 3600);
  }
}

module.exports = { CallRuntime };
