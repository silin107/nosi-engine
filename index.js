import express from 'express';
import 'dotenv/config';
import { generateWebsite } from './generator.js';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is missing');
  process.exit(1);
}

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(process.cwd()));

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Please provide a prompt' });
    }

    console.log('Generating website for prompt:', prompt);
    let websiteHtml = await generateWebsite(prompt.trim());

    if (!websiteHtml || typeof websiteHtml !== 'string' || !websiteHtml.trim()) {
      throw new Error('Generator returned empty result');
    }

    // تنظيف وسوم Markdown
    websiteHtml = websiteHtml
      .trim()
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/\s*```$/, '');

    const outputPath = path.join(process.cwd(), 'index.html');
    fs.writeFileSync(outputPath, websiteHtml, 'utf8');
    console.log('Saved generated HTML to index.html successfully!');

    res.json({ success: true, file: 'index.html', html: websiteHtml });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Error in generator engine' });
  }
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});