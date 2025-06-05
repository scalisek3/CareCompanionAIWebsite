const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load .env

const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://carecompanionai-frontend.vercel.app'
}));
app.use(express.json());

// OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// POST endpoint
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  console.log('🟡 Incoming messages:', messages);

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4', // Use gpt-3.5-turbo if needed
      messages: messages,
      temperature: 0.7
    });

    console.log('🟢 OpenAI Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('🔴 OpenAI Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});



