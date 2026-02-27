/**
 * Bhagavad Gita — 18 chapters, 701 verses
 *
 * Data sources:
 *   - bhagvatgeetaallverses.json (Sanskrit, transliteration, word meanings)
 *   - gita_translations.json (English & Hindi translations from 7 scholars)
 *
 * To add/update: edit the JSON files and re-run `npm run seed`
 */
const fs = require('fs');
const path = require('path');
const { seededRandom, shuffleSeeded, placeCorrect, parseWordMeanings, GENERIC_WRONG_MEANINGS } = require('../utils/quiz');

const BOOK_ID = 'bhagavad-gita';

const CHAPTER_NAMES = {
  1: 'Arjuna Vishada Yoga',
  2: 'Sankhya Yoga',
  3: 'Karma Yoga',
  4: 'Jnana Karma Sanyasa Yoga',
  5: 'Karma Sanyasa Yoga',
  6: 'Dhyana Yoga',
  7: 'Jnana Vijnana Yoga',
  8: 'Aksara Brahma Yoga',
  9: 'Raja Vidya Raja Guhya Yoga',
  10: 'Vibhuti Yoga',
  11: 'Vishwarupa Darshana Yoga',
  12: 'Bhakti Yoga',
  13: 'Kshetra Kshetrajna Vibhaga Yoga',
  14: 'Gunatraya Vibhaga Yoga',
  15: 'Purushottama Yoga',
  16: 'Daivasura Sampad Vibhaga Yoga',
  17: 'Shraddhatraya Vibhaga Yoga',
  18: 'Moksha Sanyasa Yoga',
};

const CHAPTER_VERSE_COUNTS = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28,
  9: 34, 10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20,
  16: 24, 17: 28, 18: 78,
};

// English translation priority
const EN_PRIORITY = ['Swami Sivananda', 'Swami Gambirananda', 'Shri Purohit Swami', 'Swami Adidevananda', 'Dr. S. Sankaranarayan'];
// Hindi translation priority
const HI_PRIORITY = ['Swami Tejomayananda', 'Swami Ramsukhdas'];

function generateQuestions(ch, vn, wordMeanings) {
  const questions = [];
  const baseSeed = ch * 1000 + vn;

  // Q1: Chapter identification
  const correctChapter = CHAPTER_NAMES[ch];
  const otherChapters = Object.entries(CHAPTER_NAMES)
    .filter(([k]) => Number(k) !== ch)
    .map(([, v]) => v);
  const wrongChapters = shuffleSeeded(otherChapters, baseSeed).slice(0, 3);
  const q1 = placeCorrect(wrongChapters, correctChapter, baseSeed + 1);
  questions.push({
    question: `Which chapter of the Bhagavad Gita contains verse ${ch}.${vn}?`,
    options: q1.options,
    correctAnswer: q1.correctIndex,
  });

  // Q2: Word meaning
  const meanings = parseWordMeanings(wordMeanings);
  if (meanings.length >= 2) {
    const pickIdx = Math.floor(seededRandom(baseSeed + 10) * meanings.length);
    const picked = meanings[pickIdx];
    const wrongPool = [
      ...meanings.filter((m) => m.word !== picked.word).map((m) => m.meaning),
      ...GENERIC_WRONG_MEANINGS,
    ];
    const uniqueWrong = [...new Set(wrongPool)].filter((w) => w !== picked.meaning);
    const wrong2 = shuffleSeeded(uniqueWrong, baseSeed + 20).slice(0, 3);
    const q2 = placeCorrect(wrong2, picked.meaning, baseSeed + 21);
    questions.push({
      question: `In verse ${ch}.${vn}, what does "${picked.word}" mean?`,
      options: q2.options,
      correctAnswer: q2.correctIndex,
    });
  } else {
    const total = CHAPTER_VERSE_COUNTS[ch] || 47;
    const wrongNums = new Set();
    let attempt = 0;
    while (wrongNums.size < 3 && attempt < 20) {
      const r = Math.floor(seededRandom(baseSeed + 50 + attempt) * total) + 1;
      if (r !== vn) wrongNums.add(r);
      attempt++;
    }
    const wrong2 = [...wrongNums].map((n) => `Verse ${n}`);
    const q2 = placeCorrect(wrong2, `Verse ${vn}`, baseSeed + 51);
    questions.push({
      question: `What is the verse number of this shloka in Chapter ${ch}?`,
      options: q2.options,
      correctAnswer: q2.correctIndex,
    });
  }

  // Q3: Chapter verse count
  const correctCount = CHAPTER_VERSE_COUNTS[ch];
  const otherCounts = [...new Set(
    Object.values(CHAPTER_VERSE_COUNTS).filter((c) => c !== correctCount)
  )];
  const wrong3 = shuffleSeeded(otherCounts, baseSeed + 30).slice(0, 3).map(String);
  const q3 = placeCorrect(wrong3, String(correctCount), baseSeed + 31);
  questions.push({
    question: `How many verses are in Chapter ${ch} (${CHAPTER_NAMES[ch]})?`,
    options: q3.options,
    correctAnswer: q3.correctIndex,
  });

  return questions;
}

function getVerses() {
  // Load verse data
  const versesPath = path.join(__dirname, '..', '..', 'bhagvatgeetaallverses.json');
  const allVerses = JSON.parse(fs.readFileSync(versesPath, 'utf-8'));

  // Load translations
  const translationsPath = path.join(__dirname, '..', '..', 'gita_translations.json');
  let translationMap = {};
  if (fs.existsSync(translationsPath)) {
    const rawTranslations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));
    // Group by verse_id
    const byVerse = {};
    rawTranslations.forEach((t) => {
      const id = t.verse_id;
      if (!byVerse[id]) byVerse[id] = { en: [], hi: [] };
      const entry = { author: t.authorName, text: (t.description || '').trim() };
      if (t.lang === 'english') byVerse[id].en.push(entry);
      if (t.lang === 'hindi') byVerse[id].hi.push(entry);
    });

    function pickBest(entries, priorityList) {
      for (const preferred of priorityList) {
        const match = entries.find((e) => e.author === preferred && e.text);
        if (match) return match.text;
      }
      const fallback = entries.find((e) => e.text);
      return fallback ? fallback.text : '';
    }

    // Build id → translations
    for (const [id, data] of Object.entries(byVerse)) {
      translationMap[id] = {
        en: pickBest(data.en, EN_PRIORITY),
        hi: pickBest(data.hi, HI_PRIORITY),
      };
    }
  }

  return allVerses.map((v) => {
    const wordMeanings = (v.word_meanings || '').trim();
    const trans = translationMap[v.id] || { en: '', hi: '' };

    return {
      bookId: BOOK_ID,
      chapter: v.chapter_number,
      verseNumber: v.verse_number,
      sanskrit: (v.text || '').replace(/\n/g, ' ').trim(),
      transliteration: (v.transliteration || '').trim(),
      wordMeanings,
      translation: trans.en,
      translations: { en: trans.en, hi: trans.hi },
      explanation: '',
      questions: generateQuestions(v.chapter_number, v.verse_number, wordMeanings),
    };
  });
}

module.exports = { bookId: BOOK_ID, getVerses };
