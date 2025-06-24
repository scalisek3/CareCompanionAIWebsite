const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios');
require('dotenv').config();
const getAccessToken = require('./getToken');

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS: allow frontend origins
const allowedOrigins = [
  'https://carecompanionai-frontend.vercel.app',
  'https://care-companion-ai-website.vercel.app',
  'https://carecompanionai-website.onrender.com',
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat-with-tools', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.5
    });
    res.json(response);
  } catch (error) {
    console.error('❌ OpenAI error:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ error: 'Assistant error' });
  }
});

// ✅ Medicare Provider Lookup (CMS)
app.get('/api/medicare-providers', async (req, res) => {
  const { city, state, keyword = '' } = req.query;
  if (!city || !state) return res.status(400).json({ error: 'City and state required' });

  try {
    const response = await axios.get(`https://npiregistry.cms.hhs.gov/api/?version=2.1&city=${city}&state=${state}&limit=10`);
    const providers = response.data.results?.map(p => ({
      name: p.basic?.organization_name || `${p.basic?.first_name || ''} ${p.basic?.last_name || ''}`.trim(),
      specialty: p.taxonomies?.[0]?.desc || 'Unknown',
      phone: p.addresses?.[0]?.telephone_number || 'N/A',
      address: `${p.addresses?.[0]?.address_1 || ''}, ${p.addresses?.[0]?.city || ''}, ${p.addresses?.[0]?.state || ''}`.trim()
    })) || [];

    const filtered = keyword ? providers.filter(p => p.specialty.toLowerCase().includes(keyword.toLowerCase())) : providers;
    res.json({ providers: filtered });
  } catch (err) {
    console.error('❌ CMS provider lookup error:', err.message);
    res.status(500).json({ error: 'CMS provider lookup failed' });
  }
});

// ✅ MedlinePlus Connect (health term definition)
app.get('/api/medline', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    const response = await axios.get(`https://connect.medlineplus.gov/application?mainSearchCriteria.v.c=${encodeURIComponent(q)}&mainSearchCriteria.v.cs=2.16.840.1.113883.6.96&informationRecipient.languageCode.c=en&knowledgeResponseType=application/json`);
    const summary = response.data.feed?.entry?.[0]?.summary || '';
    res.json({ summary });
  } catch (err) {
    console.error('❌ MedlinePlus error:', err.message);
    res.status(500).json({ error: 'MedlinePlus lookup failed' });
  }
});

// ✅ OpenFDA drug information
app.get('/api/openfda', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    const response = await axios.get(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(q)}&limit=3`);
    res.json({ results: response.data.results });
  } catch (err) {
    console.error('❌ OpenFDA error:', err.message);
    res.status(500).json({ error: 'OpenFDA lookup failed' });
  }
});

// ✅ ClinicalTrials.gov
app.get('/api/clinicaltrials', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    const response = await axios.get(`https://clinicaltrials.gov/api/query/study_fields?expr=${encodeURIComponent(q)}&fields=NCTId,BriefTitle,Condition,LocationCountry&min_rnk=1&max_rnk=3&fmt=json`);
    const trials = response.data.StudyFieldsResponse.StudyFields.map(t => ({
      title: t.BriefTitle[0],
      url: `https://clinicaltrials.gov/ct2/show/${t.NCTId[0]}`
    }));
    res.json(trials);
  } catch (err) {
    console.error('❌ ClinicalTrials.gov error:', err.message);
    res.status(500).json({ error: 'Clinical trials lookup failed' });
  }
});

// ✅ Availity coverage check (if token is working)
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

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ CareCompanionAI backend running on port ${port}`);
});

