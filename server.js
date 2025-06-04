const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads .env file

const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://carecompanionai-frontend.vercel.app' // Allow frontend to access backend
}));
app.use(express.json()); // Parse incoming JSON

// Setup OpenAI configuration using API key from .env
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// POST endpoint to handle chat messages
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  console.log('🟡 Incoming message:', messages);

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4', // Or 'gpt-3.5-turbo' if that's what you're using
      messages: messages
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


