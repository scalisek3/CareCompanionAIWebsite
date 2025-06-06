const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.includes('vercel.app') ||
      origin === 'http://localhost:3000'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// ✅ Initialize OpenAI correctly
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Route MUST match frontend POST
app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  console.log('💬 [Incoming] Messages:', messages.map(m => m.content).join(' | '));

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages,
      temperature: 0.5
    });

    console.log('✅ [OpenAI Response]', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ [OpenAI Error]', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});


