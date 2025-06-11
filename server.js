const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ Add all trusted frontend origins here
const allowedOrigins = [
  'https://carecompanionai-frontend.vercel.app',
  'https://carecompanionai-frontend-73l9n0gwa-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-fkxzdzexn-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-6z6m5aygx-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-frq1nz5eg-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-kathy-scalises-projects.vercel.app',
  'http://localhost:3000'
];

// ✅ Dynamic CORS configuration
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

// ✅ Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ POST route must match frontend
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
    console.error('❌ OpenAI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
