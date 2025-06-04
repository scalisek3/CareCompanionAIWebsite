const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors({
  origin: 'https://carecompanionai-frontend.vercel.app'
}));
app.use(express.json());

console.log('OPENAI_API_KEY is:', process.env.OPENAI_API_KEY); // Confirm .env loaded

app.post('/api/chat', async (req, res) => {
  console.log('Received request:', req.body); // Confirm message received
  const { messages } = req.body;

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: messages
    });
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages
      })
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server actually running on http://localhost:${port}`);
});

