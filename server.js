const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios');
require('dotenv').config();
const getAccessToken = require('./getToken');

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS
app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin === 'https://carecompanionai-website.onrender.com'
    ) {
      callback(null, true);
    } else {
      console.error(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('CORS policy: Origin not allowed'));
    }
  }
}));

app.use(express.json());

// ✅ OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ========= Chat with Tools =========
app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;

  // System prompt enforced here
  const systemMessage = {
    role: 'system',
    content: `You are CareCompanionAI, an advanced healthcare assistant.
You have access to the following real-time tools:
1) Medicare Provider Lookup (for doctors, hospice, nursing homes)
2) MedlinePlus (for health topic definitions)
3) OpenFDA (for drug & device information)
4) ClinicalTrials.gov (for active clinical trials).

Always use these tools whenever possible before answering.
Return clear, complete results (including names, addresses, phone numbers, URLs).
If a tool fails, gracefully let the user know and suggest alternatives.
Do not guess or make up information.`
  };

  // Insert system prompt only if not already present
  const updatedMessages = messages[0]?.role === 'system'
    ? messages
    : [systemMessage, ...messages];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: updatedMessages,
      tools: [
        {
          type: "function",
          function: {
            name: "getMedicareProviders",
            description: "Lookup Medicare providers by city, state, and optional keyword",
            parameters: {
              type: "object",
              properties: {
                city: { type: "string" },
                state: { type: "string" },
                keyword: { type: "string" }
              },
              required: ["city", "state"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getMedlineSummary",
            description: "Get health topic summary from MedlinePlus",
            parameters: {
              type: "object",
              properties: { q: { type: "string" } },
              required: ["q"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getOpenFDA",
            description: "Get drug label information from OpenFDA",
            parameters: {
              type: "object",
              properties: { q: { type: "string" } },
              required: ["q"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getClinicalTrials",
            description: "Find clinical trials by keyword",
            parameters: {
              type: "object",
              properties: { q: { type: "string" } },
              required: ["q"]
            }
          }
        }
      ]
    });

    const message = response.choices[0].message;

    // If GPT called a function, handle it
    if (message.tool_calls && message.tool_calls.length > 0) {
      const tool = message.tool_calls[0];
      const args = JSON.parse(tool.function.arguments);

      let toolResponse = null;

      try {
        switch (tool.function.name) {
          case "getMedicareProviders":
            toolResponse = await getMedicareProviders(args.city, args.state, args.keyword || '');
            break;
          case "getMedlineSummary":
            toolResponse = await getMedlineSummary(args.q);
            break;
          case "getOpenFDA":
            toolResponse = await getOpenFDA(args.q);
            break;
          case "getClinicalTrials":
            toolResponse = await getClinicalTrials(args.q);
            break;
        }
      } catch (toolError) {
        console.error(`❌ Tool execution error:`, toolError.message);
        return res.status(500).json({ error: `Tool execution failed: ${toolError.message}` });
      }

      // Respond with the tool result
      return res.json({
        tool: tool.function.name,
        result: toolResponse
      });
    }

    // If no function was called, return GPT text
    res.json(response);

  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========= Helper Functions =========

async function getMedicareProviders(city, state, keyword) {
  const response = await axios.get(`https://npiregistry.cms.hhs.gov/api/`, {
    params: { version: 2.1, city, state, limit: 10 }
  });

  const providers = response.data.results?.map(p => ({
    name: p.basic?.organization_name || `${p.basic?.first_name || ''} ${p.basic?.last_name || ''}`.trim(),
    specialty: p.taxonomies?.[0]?.desc || 'Unknown',
    phone: p.addresses?.[0]?.telephone_number || 'N/A',
    address: `${p.addresses?.[0]?.address_1 || ''}, ${p.addresses?.[0]?.city || ''}, ${p.addresses?.[0]?.state || ''}`.trim()
  })) || [];

  return keyword
    ? providers.filter(p => p.specialty.toLowerCase().includes(keyword.toLowerCase()))
    : providers;
}

async function getMedlineSummary(q) {
  const response = await axios.get(`https://connect.medlineplus.gov/application`, {
    params: {
      'mainSearchCriteria.v.c': q,
      'mainSearchCriteria.v.cs': '2.16.840.1.113883.6.96',
      'informationRecipient.languageCode.c': 'en',
      knowledgeResponseType: 'application/json'
    }
  });
  return response.data.feed?.entry?.[0]?.summary || 'No summary available.';
}

async function getOpenFDA(q) {
  const response = await axios.get(`https://api.fda.gov/drug/label.json`, {
    params: { search: `openfda.brand_name:${q}`, limit: 3 }
  });
  return response.data.results;
}

async function getClinicalTrials(q) {
  const response = await axios.get(`https://clinicaltrials.gov/api/query/study_fields`, {
    params: {
      expr: q,
      fields: 'NCTId,BriefTitle,Condition,LocationCountry',
      min_rnk: 1,
      max_rnk: 3,
      fmt: 'json'
    }
  });
  return response.data.StudyFieldsResponse.StudyFields.map(t => ({
    title: t.BriefTitle[0],
    url: `https://clinicaltrials.gov/ct2/show/${t.NCTId[0]}`
  }));
}

// ========= Availity Coverage Check =========
app.post('/api/coverage-check', async (req, res) => {
  const payload = req.body;
  try {
    const token = await getAccessToken();
    const response = await axios.post(
      'https://api.availity.com/availity/development-partner/v1/coverages',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('❌ Availity coverage check failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Coverage check failed' });
  }
});

app.listen(port, () => {
  console.log(`✅ CareCompanionAI backend running on port ${port}`);
});
