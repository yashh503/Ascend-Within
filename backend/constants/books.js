const BOOKS = {
  'bhagavad-gita': {
    id: 'bhagavad-gita',
    name: 'Bhagavad Gita',
    wisdomPath: 'hinduism',
    totalChapters: 18,
    totalVerses: 701,
    chapters: {
      1: { name: 'Arjuna Vishada Yoga', verseCount: 47 },
      2: { name: 'Sankhya Yoga', verseCount: 72 },
      3: { name: 'Karma Yoga', verseCount: 43 },
      4: { name: 'Jnana Karma Sanyasa Yoga', verseCount: 42 },
      5: { name: 'Karma Sanyasa Yoga', verseCount: 29 },
      6: { name: 'Dhyana Yoga', verseCount: 47 },
      7: { name: 'Jnana Vijnana Yoga', verseCount: 30 },
      8: { name: 'Aksara Brahma Yoga', verseCount: 28 },
      9: { name: 'Raja Vidya Raja Guhya Yoga', verseCount: 34 },
      10: { name: 'Vibhuti Yoga', verseCount: 42 },
      11: { name: 'Vishwarupa Darshana Yoga', verseCount: 55 },
      12: { name: 'Bhakti Yoga', verseCount: 20 },
      13: { name: 'Kshetra Kshetrajna Vibhaga Yoga', verseCount: 35 },
      14: { name: 'Gunatraya Vibhaga Yoga', verseCount: 27 },
      15: { name: 'Purushottama Yoga', verseCount: 20 },
      16: { name: 'Daivasura Sampad Vibhaga Yoga', verseCount: 24 },
      17: { name: 'Shraddhatraya Vibhaga Yoga', verseCount: 28 },
      18: { name: 'Moksha Sanyasa Yoga', verseCount: 78 },
    },
  },
};

const VALID_TARGETS = ['half_chapter', 'full_chapter', 'custom_5', 'custom_10', 'custom_15', 'custom_20'];

function getBooksForWisdomPath(wisdomPath) {
  return Object.values(BOOKS).filter((b) => b.wisdomPath === wisdomPath);
}

function getSessionVerseCount(dailyTarget, chapterVerseCount, currentVerseInChapter) {
  const remainingInChapter = chapterVerseCount - currentVerseInChapter;

  let targetCount;
  switch (dailyTarget) {
    case 'half_chapter':
      targetCount = Math.ceil(chapterVerseCount / 2);
      break;
    case 'full_chapter':
      targetCount = chapterVerseCount;
      break;
    case 'custom_5':
      targetCount = 5;
      break;
    case 'custom_10':
      targetCount = 10;
      break;
    case 'custom_15':
      targetCount = 15;
      break;
    case 'custom_20':
      targetCount = 20;
      break;
    default:
      targetCount = 5;
  }

  return Math.min(targetCount, remainingInChapter);
}

module.exports = { BOOKS, VALID_TARGETS, getBooksForWisdomPath, getSessionVerseCount };
