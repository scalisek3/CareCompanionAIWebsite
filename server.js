const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'https://carecompanionai-frontend.vercel.app' }));
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// 🔹 NEW SMART ENDPOINT
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


