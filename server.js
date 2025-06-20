const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios');
require('dotenv').config();
const getAccessToken = require('./getToken');

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS configuration
const allowedOrigins = [
  'https://carecompanionai-frontend.vercel.app',
  'https://carecompanionai-frontend-kswrgvtj0-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-rg9w61dmw-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website.vercel.app',
  'https://care-companion-ai-website-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-7j79-git-main-kathy-scalises-projects.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  }
}));

app.use(express.json());

// ✅ Availity Coverage Check Endpoint
app.post('/api/coverage-check', async (req, res) => {
  const token = await getAccessToken();
  const payload = req.body;

  try {
    const response = await axios.post(
      'https://api.availity.com/availity/development-partner/v1/coverages',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('❌ Coverage check failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Coverage check failed' });
  }
});

// ✅ Availity token test route (optional for testing)
app.get('/api/coverage-check', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (err) {
    console.error('❌ Token fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// ✅ OpenAI Chat Completion
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  console.log('💬 Received messages:', messages.map(m => m.content).join(' | '));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.5
    });
    console.log('✅ Assistant replied');
    res.json(response);
  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

// ✅ Medicare Provider Lookup (CMS API)
app.get('/api/medicare-providers', async (req, res) => {
  const { city, state, keyword = '' } = req.query;
  if (!city || !state) {
    return res.status(400).json({ error: 'City and state are required.' });
  }

  try {
    const response = await axios.get(`https://npiregistry.cms.hhs.gov/api/?version=2.1&city=${city}&state=${state}&limit=10`);
    const providers = response.data.results?.map(p => ({
      name: p.basic?.organization_name || `${p.basic?.first_name || ''} ${p.basic?.last_name || ''}`.trim() || 'N/A',
      specialty: p.taxonomies?.[0]?.desc || 'Unknown',
      phone: p.addresses?.[0]?.telephone_number || 'N/A',
      address: `${p.addresses?.[0]?.address_1 || ''}, ${p.addresses?.[0]?.city || ''}, ${p.addresses?.[0]?.state || ''}`.trim()
    })) || [];

    const filtered = keyword
      ? providers.filter(p => p.specialty.toLowerCase().includes(keyword.toLowerCase()))
      : providers;

    res.json({ providers: filtered });
  } catch (err) {
    console.error('❌ Medicare provider lookup failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch Medicare providers' });
  }
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`✅ CareCompanionAI backend running on port ${port}`);
});
