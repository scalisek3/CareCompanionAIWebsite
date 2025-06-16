const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ Allowlist trusted frontend URLs
const allowedOrigins = [
  'http://localhost:3000',
  'https://carecompanionai-frontend.vercel.app',
  'https://carecompanionai-frontend-kswrgvtj0-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-rg9w61dmw-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-7j79-git-main-kathy-scalises-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: This origin is not allowed'));
    }
  }
}));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Real provider data from NPPES
app.get('/api/medicare-providers', async (req, res) => {
  const { city, state } = req.query;
  try {
    const response = await axios.get(`https://npiregistry.cms.hhs.gov/api/?version=2.1&city=${city}&state=${state}&limit=10`);
    const providers = response.data.results.map(p => ({
      name: p.basic.name || `${p.basic.first_name} ${p.basic.last_name}`,
      specialty: p.taxonomies?.[0]?.desc,
      phone: p.addresses?.[0]?.telephone_number,
      address: `${p.addresses?.[0]?.address_1}, ${p.addresses?.[0]?.city}, ${p.addresses?.[0]?.state}`
    }));
    res.json({ providers });
  } catch (error) {
    console.error('❌ Medicare lookup failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch Medicare providers' });
  }
});

// ✅ Chat endpoint using GPT-3.5
app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  const context = messages.slice(-10); // Only last 10 messages for speed

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: context,
      temperature: 0.5
    });

    res.json(response);
  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});

