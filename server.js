const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS – only frontend origins
const allowedOrigins = [
  'https://carecompanionai-frontend.vercel.app',
  'https://carecompanionai-frontend-kswrgvtj0-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-rg9w61dmw-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-git-main-kathy-scalises-projects.vercel.app',
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

// ✅ OpenAI config
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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


// ✅ API route
app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  console.log('💬 Received messages:', messages.map(m => m.content).join(' | '));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
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

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
