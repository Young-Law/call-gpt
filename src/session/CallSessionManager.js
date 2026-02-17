const {
  GptService,
  StreamService,
  TranscriptionService,
  TextToSpeechService,
  recordingService,
} = require('../services');
const { RedisSessionStore } = require('../state/RedisSessionStore');

class CallSessionManager {
  constructor(ws) {
    this.ws = ws;
    this.streamSid = null;
    this.callSid = null;
    this.marks = [];
    this.interactionCount = 0;

    this.gptService = new GptService();
    this.streamService = new StreamService(ws);
    this.transcriptionService = new TranscriptionService();
    this.ttsService = new TextToSpeechService();
    this.sessionStore = new RedisSessionStore();
  }

  async initialize() {
    this.ws.on('error', console.error);

    this.ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        await this.handleIncomingMessage(msg);
      } catch (error) {
        console.error('Error handling websocket message:', {
          callSid: this.callSid,
          streamSid: this.streamSid,
          error: error.message,
        });
      }
    });

    this.transcriptionService.on('utterance', async (text) => {
      try {
        if (this.marks.length > 0 && text?.length > 5) {
          console.log('Twilio -> Interruption, Clearing stream'.red);
          this.ws.send(
            JSON.stringify({
              streamSid: this.streamSid,
              event: 'clear',
            }),
          );
        }
      } catch (error) {
        console.error('Error handling utterance event:', {
          callSid: this.callSid,
          streamSid: this.streamSid,
          error: error.message,
        });
      }
    });

    this.transcriptionService.on('transcription', async (text) => {
      try {
        if (!text) {
          return;
        }
        console.log(`Interaction ${this.interactionCount} – STT -> GPT: ${text}`.yellow);
        await Promise.resolve(this.gptService.completion(text, this.interactionCount));
        this.interactionCount += 1;
        await this.saveSessionState('active');
      } catch (error) {
        console.error('Error handling transcription event:', {
          callSid: this.callSid,
          streamSid: this.streamSid,
          error: error.message,
        });
      }
    });

    this.gptService.on('gptreply', async (gptReply, icount) => {
      try {
        console.log(`Interaction ${icount}: GPT -> TTS: ${gptReply.partialResponse}`.green);
        await Promise.resolve(this.ttsService.generate(gptReply, icount));
      } catch (error) {
        console.error('Error handling gptreply event:', {
          callSid: this.callSid,
          streamSid: this.streamSid,
          error: error.message,
        });
      }
    });

    this.ttsService.on('speech', (responseIndex, audio, label, icount) => {
      console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`.blue);
      this.streamService.buffer(responseIndex, audio);
    });

    this.streamService.on('audiosent', (markLabel) => {
      this.marks.push(markLabel);
    });
  }

  async handleIncomingMessage(msg) {
    if (msg.event === 'start') {
      await this.handleStart(msg);
      return;
    }

    if (msg.event === 'media') {
      this.transcriptionService.send(msg.media.payload);
      return;
    }

    if (msg.event === 'mark') {
      const label = msg.mark.name;
      console.log(`Twilio -> Audio completed mark (${msg.sequenceNumber}): ${label}`.red);
      this.marks = this.marks.filter((mark) => mark !== label);
      return;
    }

    if (msg.event === 'stop') {
      console.log(`Twilio -> Media stream ${this.streamSid} ended.`.underline.red);
      await this.saveSessionState('ended');
    }
  }

  async handleStart(msg) {
    this.streamSid = msg.start.streamSid;
    this.callSid = msg.start.callSid;

    this.streamService.setStreamSid(this.streamSid);
    this.gptService.setCallSid(this.callSid);

    await this.saveSessionState('started');

    await recordingService(this.ttsService, this.callSid);

    console.log(`Twilio -> Starting Media Stream for ${this.streamSid}`.underline.red);
    this.ttsService.generate(
      {
        partialResponseIndex: null,
        partialResponse: 'Hello, and thank you for calling E Orum Young Law, LLC. How may we be of service to you today?',
      },
      0,
    );
  }

  async saveSessionState(status) {
    await this.sessionStore.setSessionValue(
      this.callSid || this.streamSid,
      {
        callSid: this.callSid,
        streamSid: this.streamSid,
        status,
        interactionCount: this.interactionCount,
        updatedAt: new Date().toISOString(),
      },
      3600,
    );
  }
}

module.exports = { CallSessionManager };
