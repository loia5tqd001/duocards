import express from 'express';
import cors from 'cors';
import { scrapeCambridgeWord } from './lib/cambridge-scraper.js';

const app = express();
app.use(cors({ origin: '*' }));

app.get('/api/cambridge/:word', async (req, res) => {
  const { word } = req.params;
  
  try {
    const data = await scrapeCambridgeWord(word);
    res.json(data);
  } catch (err) {
    console.error('Cambridge API error:', err);
    res.status(500).json({ error: 'Failed to fetch or parse Cambridge page.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Cambridge proxy running on http://localhost:${PORT}`);
});
