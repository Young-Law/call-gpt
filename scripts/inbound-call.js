require('dotenv').config();
const { config } = require('../src/config');

async function makeInboundCall() {
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);

  const twiml = new VoiceResponse();
  twiml.pause({ length: 10 });
  twiml.say('Which models of airpods do you have available right now?');
  twiml.pause({ length: 30 });
  twiml.hangup();

  await client.calls.create({
    twiml: twiml.toString(),
    to: process.env.APP_NUMBER,
    from: process.env.FROM_NUMBER,
  });
}

makeInboundCall();
