require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Verse = require('../models/Verse');

// ─────────────────────────────────────────────────────────────────────────────
// Chapter metadata
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic random (so quizzes are stable across seeds)
// ─────────────────────────────────────────────────────────────────────────────

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function shuffleSeeded(arr, seed) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 3) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function placeCorrect(wrongOptions, correct, seed) {
  const all = [...wrongOptions.slice(0, 3), correct];
  const shuffled = shuffleSeeded(all, seed);
  return { options: shuffled, correctIndex: shuffled.indexOf(correct) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse "word—meaning; word—meaning" format
// ─────────────────────────────────────────────────────────────────────────────

function parseWordMeanings(text) {
  if (!text) return [];
  const pairs = [];
  const segments = text.split(';').flatMap((s) => s.split('\n')).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const idx = seg.indexOf('—');
    if (idx > 0) {
      const word = seg.substring(0, idx).trim();
      const meaning = seg.substring(idx + 1).trim();
      if (word && meaning && word.length < 50 && meaning.length < 100) {
        pairs.push({ word, meaning });
      }
    }
  }
  return pairs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate 3 quiz questions per verse
// ─────────────────────────────────────────────────────────────────────────────

const GENERIC_WRONG_MEANINGS = [
  'to conquer all', 'the supreme truth', 'eternal bliss', 'divine weapon',
  'sacred river', 'holy offering', 'cosmic dance', 'celestial abode',
  'the destroyer', 'universal form', 'material nature', 'illusion',
  'the eternal soul', 'the creator', 'divine grace', 'spiritual liberation',
  'inner peace', 'worldly attachment', 'supreme knowledge', 'mortal body',
  'sacred duty', 'divine love', 'mental discipline', 'path of devotion',
  'field of action', 'sense gratification', 'transcendental bliss', 'unmanifest',
];

function generateQuestions(ch, vn, wordMeanings) {
  const questions = [];
  const baseSeed = ch * 1000 + vn;

  // ── Q1: Chapter identification ──────────────────────────────────────────
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

  // ── Q2: Word meaning (from word_meanings data) ─────────────────────────
  const meanings = parseWordMeanings(wordMeanings);
  if (meanings.length >= 2) {
    // Pick a word deterministically
    const pickIdx = Math.floor(seededRandom(baseSeed + 10) * meanings.length);
    const picked = meanings[pickIdx];

    // Build wrong answers from other meanings in this verse + generic pool
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
    // Fallback: verse position question
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

  // ── Q3: Chapter verse count ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Main seeder
// ─────────────────────────────────────────────────────────────────────────────

const seedVerses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Load all 701 verses from JSON
    const jsonPath = path.join(__dirname, '..', 'bhagvatgeetaallverses.json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const allVerses = JSON.parse(rawData);
    console.log(`Loaded ${allVerses.length} verses from bhagvatgeetaallverses.json`);

    // Transform each verse to our Mongoose schema
    const documents = allVerses.map((v) => ({
      bookId: 'bhagavad-gita',
      chapter: v.chapter_number,
      verseNumber: v.verse_number,
      sanskrit: (v.text || '').replace(/\n/g, ' ').trim(),
      transliteration: (v.transliteration || '').trim(),
      wordMeanings: (v.word_meanings || '').trim(),
      translation: '',
      explanation: '',
      questions: generateQuestions(
        v.chapter_number,
        v.verse_number,
        (v.word_meanings || '').trim()
      ),
    }));

    // Clear existing Gita verses (not other books)
    await Verse.deleteMany({ bookId: 'bhagavad-gita' });
    console.log('Cleared existing Bhagavad Gita verses');

    // Insert in batches of 100
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < documents.length; i += BATCH) {
      const batch = documents.slice(i, i + BATCH);
      await Verse.insertMany(batch);
      inserted += batch.length;
      console.log(`  Inserted ${inserted} / ${documents.length} verses`);
    }

    // Print summary
    console.log('\n========== Seeding Complete ==========');
    console.log(`Total verses seeded: ${documents.length}`);
    console.log(`Total quiz questions: ${documents.length * 3}`);
    console.log('\nVerses per chapter:');
    const counts = {};
    documents.forEach((d) => { counts[d.chapter] = (counts[d.chapter] || 0) + 1; });
    Object.keys(counts).sort((a, b) => a - b).forEach((ch) => {
      console.log(`  Ch ${ch.padStart(2)} - ${CHAPTER_NAMES[ch]}: ${counts[ch]} verses`);
    });
    console.log('======================================\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedVerses();
