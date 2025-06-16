const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS – only allow specific frontends
const allowedOrigins = [
  'https://carecompanionai-frontend.vercel.app',
  'https://carecompanionai-frontend-kswrgvtj0-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-rg9w61dmw-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-7j79-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-kathy-scalises-projects.vercel.app',
  'http://localhost:3000'
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

// ✅ OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Static example provider lookup (optional fallback)
app.get('/api/providers', (req, res) => {
  const { city, state } = req.query;
  const providers = [
    { name: "Dr. Alice Thompson", specialty: "Primary Care", city: "Temecula", state: "CA", medicare: true },
    { name: "Dr. Bob Nguyen", specialty: "Cardiology", city: "Sacramento", state: "CA", medicare: true },
    { name: "Dr. Carla Lopez", specialty: "Geriatrics", city: "Temecula", state: "CA", medicare: true }
  ];

  const filtered = providers.filter(p =>
    p.city.toLowerCase() === city?.toLowerCase() &&
    p.state.toLowerCase() === state?.toLowerCase()
  );

  res.json({ results: filtered });
});

// ✅ Medicare Provider Directory via CMS NPI API
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
    console.error('❌ Medicare provider lookup failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch Medicare providers' });
  }
});

// ✅ (Optional) Mock UnitedHealthcare provider lookup
app.get('/api/uhc-providers', (req, res) => {
  const { specialty, zip } = req.query;
  const dummyProviders = [
    { name: "Dr. Susan Smith", specialty, zip, plan: "UHC Medicare Advantage", phone: "(800) 123-4567" },
    { name: "Dr. John Lee", specialty, zip, plan: "UHC Dual Complete", phone: "(800) 765-4321" }
  ];
  res.json({ providers: dummyProviders });
});

// ✅ Main chat endpoint
app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  console.log('💬 Received messages:', messages.map(m => m.content).join(' | '));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.5
    });

    console.log('✅ OpenAI replied:', response.choices[0].message);
    res.json(response);
  } catch (error) {
    if (error.response) {
      console.error('❌ OpenAI error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Unknown error:', error.message);
    }
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});

