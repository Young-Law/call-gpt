//require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ZOHO_CLIENT_ID = "1000.MSQ6UUM7ZXNMWXXE73OMGQ1IPDODGP";
const ZOHO_CLIENT_SECRET = "8b78035f327b7e22a18f3d514c1118e166dfbad648";
const ZOHO_GRANT_TOKEN = "1000.d4ead7125d857f8b4cb51395cb47bf78.897869ee4a16e34b45ee11e9ac64cdd8";
let ZOHO_REFRESH_TOKEN = "1000.e9fb9e657a95f0c72f7c80275ccd47bd.01d451cf05aa125d842909dbe795c453";

//const envPath = path.resolve(__dirname, '../.env');

/*// --- One-Time Setup: Get Refresh Token from Grant Token ---
async function initializeRefreshToken() {
  if (ZOHO_REFRESH_TOKEN) {
    console.log('Refresh token already exists. Skipping initialization.');
    return;
  }

  if (!ZOHO_GRANT_TOKEN || ZOHO_GRANT_TOKEN === 'YOUR_GRANT_TOKEN_HERE') {
    throw new Error('Grant token is missing. Please generate one from the Zoho API console and add it to your .env file.');
  }

  try {
    console.log('Initializing refresh token from grant token...');
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        code: ZOHO_GRANT_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'authorization_code',
      },
    });

    if (!response.data.refresh_token) {
        throw new Error('Failed to obtain refresh token. The grant token might be expired or invalid.');
    }

    ZOHO_REFRESH_TOKEN = response.data.refresh_token;

    // Save the refresh token to the .env file
    let envFileContent = fs.readFileSync(envPath, 'utf8');
    envFileContent = envFileContent.replace(/(ZOHO_REFRESH_TOKEN=)./, `$1${ZOHO_REFRESH_TOKEN}`);
    fs.writeFileSync(envPath, envFileContent);

    console.log('Refresh token obtained and saved successfully.');
    return response.data.access_token;
  } catch (error) {
    console.error('Error initializing refresh token:', error.response ? error.response.data : error.message);
    throw new Error('Could not initialize refresh token.');
  }
}
*/
// --- Main Function: Get a valid Access Token ---
async function getAccessToken() {
  if (!ZOHO_REFRESH_TOKEN) {
    // If there's no refresh token, try to get one using the grant token.
    return await initializeRefreshToken();
  }

  try {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    throw new Error('Could not refresh access token. The refresh token may be invalid or revoked.');
  }
}

module.exports = {
  getAccessToken,
  initializeRefreshToken,
};
