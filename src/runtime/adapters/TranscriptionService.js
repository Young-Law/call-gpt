require('colors');
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');
const { Buffer } = require('node:buffer');
const EventEmitter = require('events');
const { config } = require('../../config');

class TranscriptionService extends EventEmitter {
  constructor({ deepgramFactory = createClient } = {}) {
    super();
    const deepgram = deepgramFactory(config.deepgram.apiKey);
    this.dgConnection = deepgram.listen.live({ encoding: 'mulaw', sample_rate: '8000', model: 'nova-2', punctuate: true, interim_results: true, endpointing: 200, utterance_end_ms: 1000 });
    this.finalResult = '';
    this.speechFinal = false;

    this.dgConnection.on(LiveTranscriptionEvents.Open, () => {
      this.dgConnection.on(LiveTranscriptionEvents.Transcript, (event) => {
        const text = event.channel?.alternatives?.[0]?.transcript || '';
        if (event.type === 'UtteranceEnd') {
          if (!this.speechFinal) this.emit('transcription', this.finalResult);
          return;
        }
        if (event.is_final === true && text.trim().length > 0) {
          this.finalResult += ` ${text}`;
          if (event.speech_final === true) {
            this.speechFinal = true;
            this.emit('transcription', this.finalResult);
            this.finalResult = '';
          } else {
            this.speechFinal = false;
          }
        } else {
          this.emit('utterance', text);
        }
      });
    });
  }

  send(payload) {
    if (this.dgConnection.getReadyState() === 1) this.dgConnection.send(Buffer.from(payload, 'base64'));
  }
}

module.exports = { TranscriptionService };
