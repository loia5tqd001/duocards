import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));

app.get('/api/cambridge/:word', async (req, res) => {
  const { word } = req.params;
  const url = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(
    word
  )}`;
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0', // Cambridge blocks bots, so fake UA
      },
    });
    const $ = cheerio.load(html);

    // Extract word, phonetic, part of speech
    const wordText = $('.hw.dhw').first().text();
    const phonetic = $('.pron.dpron').first().text();
    const partOfSpeech = $('.pos.dpos').first().text();

    // Definitions, Vietnamese translations, and examples
    const definitions = [];
    const vietnameseTranslationsSet = new Set();
    const examples = [];

    $('.def-block.ddef_block').each((i, el) => {
      // English definition
      const def = $(el).find('.def.ddef_d.db').text().trim();
      if (def) definitions.push(def);

      // Vietnamese translation (robust selector)
      const viNode = $(el).find('.trans.dtrans, .trans').first();
      const vi = viNode.text().trim();
      if (vi) vietnameseTranslationsSet.add(vi);

      // Debug: log the translation node
      // console.log('VI HTML:', viNode.html(), 'TEXT:', vi);

      // Example sentences
      $(el)
        .find('.examp.dexamp .eg.deg')
        .each((j, ex) => {
          const exText = $(ex).text().trim();
          if (exText) examples.push(exText);
        });
    });

    // Convert Set to array for unique Vietnamese translations
    const vietnameseTranslations = Array.from(vietnameseTranslationsSet);

    // Use the first translation as the main one
    const mainVietnamese = vietnameseTranslations[0] || '';

    res.json({
      word: wordText,
      phonetic,
      partOfSpeech,
      definitions,
      vietnameseTranslations,
      mainVietnamese,
      examples,
      debug: vietnameseTranslations,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch or parse Cambridge page.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Cambridge proxy running on http://localhost:${PORT}`);
});
