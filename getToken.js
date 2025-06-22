const axios = require('axios');
const qs = require('qs'); // Needed for x-www-form-urlencoded body

const getAccessToken = async () => {
  try {
    const tokenResponse = await axios.post(
      'https://api.availity.com/availity/v1/token',
      qs.stringify({
        grant_type: 'client_credentials',
        scope: 'hipaa'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: {
          username: process.env.AVAILITY_CLIENT_ID,
          password: process.env.AVAILITY_CLIENT_SECRET
        }
      }
    );

    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('❌ Token error:', error.response?.data || error.message);
    throw new Error('Failed to obtain access token');
  }
};

module.exports = getAccessToken;

