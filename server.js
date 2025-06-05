const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads your .env

const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://carecompanionai-frontend.vercel.app' // Your Vercel frontend
}));
app.use(express.json());

// OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  console.log('🟡 Incoming messages:', messages);

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4', // or 'gpt-3.5-turbo' for faster responses
      messages: messages,
      temperature: 0.6
    });

    console.log('🟢 OpenAI response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('🔴 OpenAI error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

