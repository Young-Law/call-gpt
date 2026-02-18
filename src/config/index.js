const { getEnv } = require('./env');

const config = {
  server: {
    port: Number(getEnv('PORT', 8080)),
    host: getEnv('SERVER', ''),
  },
  openai: {
    model: getEnv('OPENAI_MODEL', 'gpt-4o-mini'),
  },
  deepgram: {
    apiKey: getEnv('DEEPGRAM_API_KEY', ''),
    voiceModel: getEnv('VOICE_MODEL', 'aura-asteria-en'),
  },
  twilio: {
    accountSid: getEnv('TWILIO_ACCOUNT_SID', ''),
    authToken: getEnv('TWILIO_AUTH_TOKEN', ''),
    recordingEnabled: getEnv('RECORDING_ENABLED', 'false') === 'true',
  },
  zoho: {
    clientId: getEnv('ZOHO_CLIENT_ID', ''),
    clientSecret: getEnv('ZOHO_CLIENT_SECRET', ''),
    refreshToken: getEnv('ZOHO_REFRESH_TOKEN', ''),
    appointmentTypesRaw: getEnv('ZOHO_APPOINTMENT_TYPES', '[]'),
    staffMembersRaw: getEnv('ZOHO_STAFF_MEMBERS', '[]'),
  },
};

module.exports = { config };
