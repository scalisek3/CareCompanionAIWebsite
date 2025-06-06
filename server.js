const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'https://carecompanionai-frontend.vercel.app' }));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  console.log('💬 Incoming Messages:', messages.map(m => m.content).join(' | '));

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.5
    });

    console.log('✅ OpenAI response:', completion);
    res.json(completion);
  } catch (error) {
    console.error('❌ OpenAI Error:', error);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
