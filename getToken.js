const axios = require('axios');

const getAccessToken = async () => {
  try {
    const response = await axios.post('https://api.availity.com/availity/v1/token', null, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: {
        username: process.env.AVAILITY_CLIENT_ID,
        password: process.env.AVAILITY_CLIENT_SECRET
      },
      params: {
        grant_type: 'client_credentials',
        scope: 'hipaa'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Token error:', error.response?.data || error.message);
    throw new Error('Failed to obtain access token');
  }
};

module.exports = getAccessToken;

