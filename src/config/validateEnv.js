const { getRequiredEnv } = require('./env');

function validateBaseEnv() {
  getRequiredEnv('DEEPGRAM_API_KEY');
  getRequiredEnv('OPENAI_API_KEY');
  getRequiredEnv('TWILIO_ACCOUNT_SID');
  getRequiredEnv('TWILIO_AUTH_TOKEN');
}

function validateZohoEnv() {
  getRequiredEnv('ZOHO_CLIENT_ID');
  getRequiredEnv('ZOHO_CLIENT_SECRET');
  getRequiredEnv('ZOHO_REFRESH_TOKEN');
}

function validateEnv() {
  validateBaseEnv();
  validateZohoEnv();
}

module.exports = {
  validateBaseEnv,
  validateZohoEnv,
  validateEnv,
};
