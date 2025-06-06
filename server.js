const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'https://carecompanionai-frontend.vercel.app' }));
app.use(express.json());

// Initialize OpenAI client (v4+ SDK)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🔹 SMART ENDPOINT
app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  console.log('💬 [Incoming] Messages:', messages.map(m => m.content).join(' | '));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.5
    });

    console.log('✅ [OpenAI Response]', response);
    res.json(response);
  } catch (error) {
    console.error('❌ [OpenAI Error]', error);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
