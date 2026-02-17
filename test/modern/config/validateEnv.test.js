const { validateEnv, validateBaseEnv, validateZohoEnv } = require('../../../src/config/validateEnv');

const REQUIRED_BASE = ['DEEPGRAM_API_KEY', 'OPENAI_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'];
const REQUIRED_ZOHO = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'];

function withEnv(vars, fn) {
  const snapshot = {};
  for (const key of [...REQUIRED_BASE, ...REQUIRED_ZOHO]) {
    snapshot[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, vars);

  try {
    fn();
  } finally {
    for (const key of [...REQUIRED_BASE, ...REQUIRED_ZOHO]) {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    }
  }
}

describe('validateEnv', () => {
  test('fails when Zoho credentials are missing', () => {
    withEnv({
      DEEPGRAM_API_KEY: 'x',
      OPENAI_API_KEY: 'x',
      TWILIO_ACCOUNT_SID: 'x',
      TWILIO_AUTH_TOKEN: 'x',
    }, () => {
      expect(() => validateZohoEnv()).toThrow('ZOHO_CLIENT_ID');
      expect(() => validateEnv()).toThrow('ZOHO_CLIENT_ID');
    });
  });

  test('passes when all required values are present', () => {
    withEnv({
      DEEPGRAM_API_KEY: 'x',
      OPENAI_API_KEY: 'x',
      TWILIO_ACCOUNT_SID: 'x',
      TWILIO_AUTH_TOKEN: 'x',
      ZOHO_CLIENT_ID: 'x',
      ZOHO_CLIENT_SECRET: 'x',
      ZOHO_REFRESH_TOKEN: 'x',
    }, () => {
      expect(() => validateBaseEnv()).not.toThrow();
      expect(() => validateZohoEnv()).not.toThrow();
      expect(() => validateEnv()).not.toThrow();
    });
  });
});
