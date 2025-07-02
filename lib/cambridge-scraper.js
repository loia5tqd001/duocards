import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeCambridgeWord(word) {
  const url = `https://dictionary.cambridge.org/dictionary/english-vietnamese/${encodeURIComponent(word)}`;

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

  $('.def-block.ddef_block').each((_, el) => {
    // English definition
    const def = $(el).find('.def.ddef_d.db').text().trim();
    if (def) definitions.push(def);

    // Vietnamese translation (robust selector)
    const viNode = $(el).find('.trans.dtrans, .trans').first();
    const vi = viNode.text().trim();
    if (vi) vietnameseTranslationsSet.add(vi);

    // Example sentences
    $(el)
      .find('.examp.dexamp .eg.deg')
      .each((_, ex) => {
        const exText = $(ex).text().trim();
        if (exText) examples.push(exText);
      });
  });

  // Convert Set to array for unique Vietnamese translations
  const vietnameseTranslations = Array.from(vietnameseTranslationsSet);

  // Use the first translation as the main one
  const mainVietnamese = vietnameseTranslations[0] || '';

  return {
    word: wordText,
    phonetic,
    partOfSpeech,
    definitions,
    vietnameseTranslations: vietnameseTranslations.slice(0, 5),
    mainVietnamese,
    examples: examples.slice(0, 5),
  };
}
