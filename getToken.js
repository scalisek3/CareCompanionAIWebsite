// getToken.js
const axios = require('axios');
require('dotenv').config();

async function getAccessToken() {
  const res = await axios.post('https://api.availity.com/availity/v1/token', null, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: {
      username: process.env.AV_CLIENT_ID,
      password: process.env.AV_CLIENT_SECRET
    },
    params: {
      grant_type: 'client_credentials',
      scope: 'hipaa'
    }
  });

  return res.data.access_token;
}

module.exports = getAccessToken;
