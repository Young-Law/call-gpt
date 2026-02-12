require('dotenv').config();

const axios = require('axios');

const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `[Zoho Auth] Missing required environment variable ${name}. ` +
      `Set ${name} in your environment or .env file before starting the service.`
    );
  }

  return value.trim();
}

function validateZohoEnv() {
  const requiredVariables = [
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET',
    'ZOHO_REFRESH_TOKEN',
  ];

  const missing = requiredVariables.filter((name) => {
    const value = process.env[name];
    return !value || !value.trim();
  });

  if (missing.length > 0) {
    throw new Error(
      `[Zoho Auth] Missing required Zoho credentials: ${missing.join(', ')}. ` +
      'Update your .env with valid Zoho OAuth values. ' +
      'Expected keys: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN.'
    );
  }
}

class ZohoAuthClient {
  constructor() {
    validateZohoEnv();

    this.clientId = getRequiredEnv('ZOHO_CLIENT_ID');
    this.clientSecret = getRequiredEnv('ZOHO_CLIENT_SECRET');
    this.refreshToken = getRequiredEnv('ZOHO_REFRESH_TOKEN');

    this.accessToken = null;
    this.expiresAt = 0;
    this.refreshInFlight = null;
  }

  isAccessTokenValid() {
    if (!this.accessToken || !this.expiresAt) {
      return false;
    }

    return Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS < this.expiresAt;
  }

  async getAccessToken() {
    if (this.isAccessTokenValid()) {
      return this.accessToken;
    }

    return this.refreshAccessToken();
  }

  async refreshAccessToken(force = false) {
    if (!force && this.isAccessTokenValid()) {
      return this.accessToken;
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.requestNewAccessToken()
      .then((token) => {
        this.refreshInFlight = null;
        return token;
      })
      .catch((error) => {
        this.refreshInFlight = null;
        throw error;
      });

    return this.refreshInFlight;
  }

  async requestNewAccessToken() {
    try {
      const response = await axios.post(ZOHO_TOKEN_URL, null, {
        params: {
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        },
      });

      const { access_token: accessToken, expires_in: expiresIn } = response.data || {};

      if (!accessToken) {
        throw new Error('Zoho token response did not include access_token.');
      }

      const expiresInSeconds = Number(expiresIn);
      const ttlMs = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
        ? expiresInSeconds * 1000
        : 55 * 60 * 1000;

      this.accessToken = accessToken;
      this.expiresAt = Date.now() + ttlMs;

      return this.accessToken;
    } catch (error) {
      const detail = error.response ? JSON.stringify(error.response.data) : error.message;
      throw new Error(
        `[Zoho Auth] Failed to refresh access token. ` +
        `Verify ZOHO_CLIENT_ID/ZOHO_CLIENT_SECRET/ZOHO_REFRESH_TOKEN. Details: ${detail}`
      );
    }
  }

  async executeWithAuthRetry(requestFn) {
    const token = await this.getAccessToken();

    try {
      return await requestFn(token);
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        throw error;
      }

      const refreshedToken = await this.refreshAccessToken(true);
      return requestFn(refreshedToken);
    }
  }
}

const zohoAuthClient = new ZohoAuthClient();

module.exports = {
  ZohoAuthClient,
  validateZohoEnv,
  zohoAuthClient,
};
