function validateEnv() {
  const missing = [];

  const requiredVars = [
    'DEEPGRAM_API_KEY',
    'VOICE_MODEL',
    'OPENAI_API_KEY',
  ];

  requiredVars.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (process.env.RECORDING_ENABLED === 'true') {
    ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'].forEach((key) => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { validateEnv };
