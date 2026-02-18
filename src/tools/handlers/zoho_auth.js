const { zohoAuthClient, validateZohoEnv } = require('./zoho_auth_client');

function getAccessToken() {
  return zohoAuthClient.getAccessToken();
}

function executeWithAuthRetry(requestFn) {
  return zohoAuthClient.executeWithAuthRetry(requestFn);
}

module.exports = {
  getAccessToken,
  executeWithAuthRetry,
  validateZohoEnv,
};
