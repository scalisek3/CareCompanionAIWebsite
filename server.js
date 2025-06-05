const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: req.body.messages,
    });

    res.json(response);
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).send('Failed to generate response');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

