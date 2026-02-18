const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const { config } = require('../config');

const incomingRouter = express.Router();

incomingRouter.post('/incoming', (req, res) => {
  try {
    const forwardedHost = req.get('x-forwarded-host');
    const host = forwardedHost || req.get('host') || config.server.host;
    const response = new VoiceResponse();
    const connect = response.connect();
    connect.stream({ url: `wss://${host}/connection` });

    res.type('text/xml');
    res.end(response.toString());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_generate_twiml' });
  }
});

module.exports = { incomingRouter };
