/**
 * Shared quiz generation utilities.
 * Used by all book seeders to generate deterministic quiz questions.
 */

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

const GENERIC_WRONG_MEANINGS = [
  'to conquer all', 'the supreme truth', 'eternal bliss', 'divine weapon',
  'sacred river', 'holy offering', 'cosmic dance', 'celestial abode',
  'the destroyer', 'universal form', 'material nature', 'illusion',
  'the eternal soul', 'the creator', 'divine grace', 'spiritual liberation',
  'inner peace', 'worldly attachment', 'supreme knowledge', 'mortal body',
  'sacred duty', 'divine love', 'mental discipline', 'path of devotion',
  'field of action', 'sense gratification', 'transcendental bliss', 'unmanifest',
];

module.exports = {
  seededRandom,
  shuffleSeeded,
  placeCorrect,
  parseWordMeanings,
  GENERIC_WRONG_MEANINGS,
};
