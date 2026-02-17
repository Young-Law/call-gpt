const { config } = require('../../config');

async function recordingService(ttsService, callSid, { twilioFactory = require('twilio') } = {}) {
  if (!config.twilio.recordingEnabled) return;
  const client = twilioFactory(config.twilio.accountSid, config.twilio.authToken);
  ttsService.generate({ partialResponseIndex: null, partialResponse: 'This call will be recorded.' }, 0);
  await client.calls(callSid).recordings.create({ recordingChannels: 'dual' });
}

module.exports = { recordingService };
