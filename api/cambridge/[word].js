import { scrapeCambridgeWord } from '../../lib/cambridge-scraper.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { word } = req.query;

  if (!word) {
    res.status(400).json({ error: 'Word parameter is required' });
    return;
  }

  try {
    const data = await scrapeCambridgeWord(word);
    res.json(data);
  } catch (err) {
    console.error('Cambridge API error:', err);
    res.status(500).json({ error: 'Failed to fetch or parse Cambridge page.' });
  }
}
