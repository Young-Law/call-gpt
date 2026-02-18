const axios = require('axios');
const { config } = require('../../config');

const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 60 * 1000;

function validateZohoEnv() {
  const required = ['clientId', 'clientSecret', 'refreshToken'];
  const missing = required.filter((key) => !config.zoho[key]);
  if (missing.length > 0) {
    throw new Error(`[Zoho Auth] Missing required Zoho credentials: ${missing.join(', ')}.`);
  }
}

class ZohoAuthClient {
  constructor() {
    validateZohoEnv();
    this.accessToken = null;
    this.expiresAt = 0;
    this.refreshInFlight = null;
  }

  isAccessTokenValid() {
    return Boolean(this.accessToken) && Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS < this.expiresAt;
  }

  async getAccessToken() {
    if (this.isAccessTokenValid()) return this.accessToken;
    return this.refreshAccessToken();
  }

  async refreshAccessToken(force = false) {
    if (!force && this.isAccessTokenValid()) return this.accessToken;
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = this.requestNewAccessToken()
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  async requestNewAccessToken() {
    const response = await axios.post(ZOHO_TOKEN_URL, null, {
      params: {
        refresh_token: config.zoho.refreshToken,
        client_id: config.zoho.clientId,
        client_secret: config.zoho.clientSecret,
        grant_type: 'refresh_token',
      },
    });

    const { access_token: accessToken, expires_in: expiresIn } = response.data || {};
    if (!accessToken) throw new Error('Zoho token response did not include access_token.');

    const expiresInSeconds = Number(expiresIn);
    const ttlMs = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ? expiresInSeconds * 1000 : 55 * 60 * 1000;

    this.accessToken = accessToken;
    this.expiresAt = Date.now() + ttlMs;
    return this.accessToken;
  }

  async executeWithAuthRetry(requestFn) {
    const token = await this.getAccessToken();
    try {
      return await requestFn(token);
    } catch (error) {
      if (!error.response || error.response.status !== 401) throw error;
      const refreshedToken = await this.refreshAccessToken(true);
      return requestFn(refreshedToken);
    }
  }
}

module.exports = { ZohoAuthClient, validateZohoEnv };
