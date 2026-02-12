const { zohoAuthClient, validateZohoEnv } = require('./zoho_auth_client');

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_GRANT_TOKEN = process.env.ZOHO_GRANT_TOKEN;
let ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;

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
