const { Buffer } = require('node:buffer');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const { config } = require('../../config');

class TextToSpeechService extends EventEmitter {
  async generate(gptReply, interactionCount) {
    const { partialResponseIndex, partialResponse } = gptReply;
    if (!partialResponse) return;

    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${config.deepgram.voiceModel}&encoding=mulaw&sample_rate=8000&container=none`, {
      method: 'POST',
      headers: { Authorization: `Token ${config.deepgram.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: partialResponse }),
    });

    if (response.status !== 200) return;
    const blob = await response.blob();
    const audioArrayBuffer = await blob.arrayBuffer();
    const base64String = Buffer.from(audioArrayBuffer).toString('base64');
    this.emit('speech', partialResponseIndex, base64String, partialResponse, interactionCount);
  }
}

module.exports = { TextToSpeechService };
