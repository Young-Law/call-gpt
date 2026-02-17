require('dotenv').config();
const { config } = require('../src/config');

async function makeOutBoundCall() {
  const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);

  await client.calls.create({
    url: `https://${config.server.host}/incoming`,
    to: process.env.YOUR_NUMBER,
    from: process.env.FROM_NUMBER,
  });
}

makeOutBoundCall();
