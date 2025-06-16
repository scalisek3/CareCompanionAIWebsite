const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS config — trusted frontend origins
const allowedOrigins = [
  'https://carecompanionai-frontend.vercel.app',
  'https://carecompanionai-frontend-kswrgvtj0-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-rg9w61dmw-kathy-scalises-projects.vercel.app',
  'https://carecompanionai-frontend-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-7j79-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-git-main-kathy-scalises-projects.vercel.app',
  'https://care-companion-ai-website-kathy-scalises-projects.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  }
}));

app.use(express.json());

// ✅ OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Real Medicare provider search
app.get('/api/medicare-providers', async (req, res) => {
  const { city, state } = req.query;
  try {
    const response = await axios.get(
      `https://npiregistry.cms.hhs.gov/api/?version=2.1&city=${city}&state=${state}&limit=10`
    );
    const providers = response.data.results.map(p => ({
      name: p.basic.name || `${p.basic.first_name} ${p.basic.last_name}`,
      specialty: p.taxonomies?.[0]?.desc || 'N/A',
      phone: p.addresses?.[0]?.telephone_number || 'N/A',
      address: `${p.addresses?.[0]?.address_1}, ${p.addresses?.[0]?.city}, ${p.addresses?.[0]?.state}`
    }));
    res.json({ providers });
  } catch (error) {
    console.error('❌ Medicare provider API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Medicare providers' });
  }
});

// ✅ Main OpenAI chat endpoint
app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  console.log('💬 Messages received:', messages.map(m => m.content).join(' | '));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.5,
      functions: [
        {
          name: 'find_medicare_providers',
          description: 'Search for Medicare providers by city and state',
          parameters: {
            type: 'object',
            properties: {
              city: { type: 'string', description: 'City name' },
              state: { type: 'string', description: '2-letter state code' }
            },
            required: ['city', 'state']
          }
        }
      ]
    });

    const choice = response.choices[0];

    // Handle OpenAI function call
    if (choice.finish_reason === 'function_call' && choice.message.function_call) {
      const { name, arguments: argsJson } = choice.message.function_call;
      if (name === 'find_medicare_providers') {
        const { city, state } = JSON.parse(argsJson);
        const lookup = await axios.get(`https://npiregistry.cms.hhs.gov/api/?version=2.1&city=${city}&state=${state}&limit=5`);
        const formatted = lookup.data.results.map(p => ({
          name: p.basic.name || `${p.basic.first_name} ${p.basic.last_name}`,
          specialty: p.taxonomies?.[0]?.desc || 'N/A',
          phone: p.addresses?.[0]?.telephone_number || 'N/A',
          address: `${p.addresses?.[0]?.address_1}, ${p.addresses?.[0]?.city}, ${p.addresses?.[0]?.state}`
        }));
        return res.json({
          choices: [{
            message: {
              role: 'assistant',
              content: `Here are some Medicare providers in ${city}, ${state}:\n\n` +
                formatted.map(p => `• **${p.name}** – ${p.specialty}, ${p.address}, Phone: ${p.phone}`).join('\n')
            }
          }]
        });
      }
    }

    // Default OpenAI assistant response
    res.json(response);
  } catch (error) {
    console.error('❌ Chat error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Something went wrong with the assistant.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
