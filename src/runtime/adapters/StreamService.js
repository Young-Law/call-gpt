const EventEmitter = require('events');
const uuid = require('uuid');

class StreamService extends EventEmitter {
  constructor(websocket) {
    super();
    this.ws = websocket;
    this.expectedAudioIndex = 0;
    this.audioBuffer = {};
    this.streamSid = '';
  }

  setStreamSid(streamSid) { this.streamSid = streamSid; }

  buffer(index, audio) {
    if (index === null) return this.sendAudio(audio);
    if (index === this.expectedAudioIndex) {
      this.sendAudio(audio);
      this.expectedAudioIndex += 1;
      while (Object.prototype.hasOwnProperty.call(this.audioBuffer, this.expectedAudioIndex)) {
        this.sendAudio(this.audioBuffer[this.expectedAudioIndex]);
        this.expectedAudioIndex += 1;
      }
    } else {
      this.audioBuffer[index] = audio;
    }
  }

  sendAudio(audio) {
    this.ws.send(JSON.stringify({ streamSid: this.streamSid, event: 'media', media: { payload: audio } }));
    const markLabel = uuid.v4();
    this.ws.send(JSON.stringify({ streamSid: this.streamSid, event: 'mark', mark: { name: markLabel } }));
    this.emit('audiosent', markLabel);
  }
}

module.exports = { StreamService };
