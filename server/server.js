const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const fetch = require('node-fetch'); // Required unless using native fetch in newer Node

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS middleware (allow any origin — or specify your GoDaddy frontend domain for security)
app.use(cors({
  origin: '*', // e.g., 'https://yourdomain.com'
  methods: ['GET', 'POST'],
}));

// ✅ Middleware to parse JSON bodies
app.use(bodyParser.json());

// ✅ Confirm .env is loaded
console.log('OPENAI_API_KEY is:', process.env.OPENAI_API_KEY);

// ✅ POST /api/chat route
app.post('/api/chat', async (req, res) => {
  console.log('Received request:', req.body); // Debug logging
  const { messages } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});

