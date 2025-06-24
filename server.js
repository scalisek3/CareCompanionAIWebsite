const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
require('dotenv').config();
const getAccessToken = require('./getToken');

const app = express();
const port = process.env.PORT || 5000;

// CORS config
const allowedOrigins = [
  'http://localhost:3000',
  'https://carecompanionai-frontend.vercel.app',
  'https://care-companion-ai-website.vercel.app',
  'https://care-companion-ai-website-kathy-scalises-projects.vercel.app',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS policy: Origin not allowed'));
  }
}));
app.use(express.json());

// ✅ GPT assistant setup
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
  } catch (err) {
    console.error('❌ OpenAI error:', err.message);
    res.status(500).json({ error: 'OpenAI failed' });
  }
});

// ✅ CMS NPPES (Medicare NPI)
app.get('/api/medicare-providers', async (req, res) => {
  const { city, state, keyword = '' } = req.query;
  if (!city || !state) return res.status(400).json({ error: 'Missing city/state' });

  try {
    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&city=${city}&state=${state}&limit=10`;
    const response = await axios.get(url);
    const providers = response.data.results?.map(p => ({
      name: p.basic?.organization_name || `${p.basic?.first_name || ''} ${p.basic?.last_name || ''}`.trim(),
      specialty: p.taxonomies?.[0]?.desc || 'N/A',
      phone: p.addresses?.[0]?.telephone_number || 'N/A',
      address: `${p.addresses?.[0]?.address_1 || ''}, ${p.addresses?.[0]?.city || ''}, ${p.addresses?.[0]?.state || ''}`
    })) || [];

    const filtered = keyword
      ? providers.filter(p => p.specialty.toLowerCase().includes(keyword.toLowerCase()))
      : providers;

    res.json({ providers: filtered });
  } catch (err) {
    console.error('NPPES Error:', err.message);
    res.status(500).json({ error: 'NPPES provider lookup failed' });
  }
});

// ✅ CMS Hospice/Nursing datasets
app.get('/api/cms-hospice', async (req, res) => {
  const { state } = req.query;
  try {
    const url = `https://data.cms.gov/data-api/v1/dataset/bc6c-2a7q/data?state=${state}&_limit=10`;
    const response = await axios.get(url);
    res.json({ providers: response.data });
  } catch (err) {
    console.error('Hospice error:', err.message);
    res.status(500).json({ error: 'CMS Hospice fetch failed' });
  }
});

app.get('/api/cms-nursing', async (req, res) => {
  const { state } = req.query;
  try {
    const url = `https://data.cms.gov/data-api/v1/dataset/fqcq-d5bd/data?state=${state}&_limit=10`;
    const response = await axios.get(url);
    res.json({ providers: response.data });
  } catch (err) {
    console.error('Nursing home error:', err.message);
    res.status(500).json({ error: 'CMS Nursing Home fetch failed' });
  }
});

// ✅ OpenFDA Drug Search
app.get('/api/drug-info', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing drug name' });
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${name}&limit=1`;
    const response = await axios.get(url);
    const drug = response.data.results?.[0];
    res.json({ drug });
  } catch (err) {
    console.error('Drug fetch error:', err.message);
    res.status(500).json({ error: 'OpenFDA lookup failed' });
  }
});

// ✅ MedlinePlus Connect (condition info)
app.get('/api/condition-info', async (req, res) => {
  const { term } = req.query;
  if (!term) return res.status(400).json({ error: 'Missing condition term' });
  try {
    const url = `https://connect.medlineplus.gov/application?mainSearchCriteria.v.c=${term}&mainSearchCriteria.v.cs=2.16.840.1.113883.6.96&informationRecipient.languageCode.c=en&knowledgeResponseType=application/json`;
    const response = await axios.get(url);
    res.json({ results: response.data });
  } catch (err) {
    console.error('MedlinePlus error:', err.message);
    res.status(500).json({ error: 'Condition info fetch failed' });
  }
});

// ✅ ClinicalTrials.gov search
app.get('/api/clinical-trials', async (req, res) => {
  const { condition } = req.query;
  if (!condition) return res.status(400).json({ error: 'Missing condition' });
  try {
    const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${encodeURIComponent(condition)}&fields=NCTId,BriefTitle,LocationCity,LocationState,OverallStatus&min_rnk=1&max_rnk=10&fmt=json`;
    const response = await axios.get(url);
    res.json({ trials: response.data.StudyFieldsResponse?.StudyFields || [] });
  } catch (err) {
    console.error('Trials error:', err.message);
    res.status(500).json({ error: 'ClinicalTrials.gov fetch failed' });
  }
});

// ✅ Availity Coverage Check
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
    console.error('Availity error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Coverage check failed' });
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ CareCompanionAI backend running on port ${port}`);
});
