require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Verse = require('../models/Verse');

// ─────────────────────────────────────────────────────────────────────────────
// Shiv Tandav Stotram — 13 stanzas by Ravana
// ─────────────────────────────────────────────────────────────────────────────

const BOOK_ID = 'shiv-tandav-stotram';

const STANZAS = [
  {
    verseNumber: 1,
    sanskrit:
      'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम्। डमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम्॥',
    transliteration:
      'Jatatavi galaj jala pravaha pavita sthale, Gale avalambya lambitam bhujanga tunga malikam. Damad damad damad daman ninadavad damarvayam, Chakara chanda tandavam tanotu nah shivah shivam.',
    translation:
      'With the water flowing from the dense forest of His matted hair purifying His neck, and with the great serpent garland hanging down from His neck, Lord Shiva performed the fierce Tandava dance to the thundering beats of the damaru drum. May that Shiva shower blessings on us.',
    wordMeanings:
      'जटाटवी—forest of matted hair; गलत्—flowing; जल—water; प्रवाह—stream; पावित—purified; स्थले—on the ground; गले—on the neck; अवलम्ब्य—hanging; भुजङ्ग—serpent; तुङ्ग—great; मालिकाम्—garland; डमड्डमड्—drum beats; चण्ड—fierce; ताण्डवं—Tandava dance; शिवः—Shiva; शिवम्—auspiciousness',
  },
  {
    verseNumber: 2,
    sanskrit:
      'जटाकटाहसम्भ्रमभ्रमन्निलिम्पनिर्झरी- विलोलवीचिवल्लरीविराजमानमूर्धनि। धगद्धगद्धगज्ज्वलल्ललाटपट्टपावके किशोरचन्द्रशेखरे रतिः प्रतिक्षणं मम॥',
    transliteration:
      'Jata kata ha sambhrama bhramannilimpa nirjhari, Vilola vichi vallari viraja mana murdhani. Dhagad dhagad dhagaj jvalal lalata patta pavake, Kishora chandra shekhare ratih pratikshanam mama.',
    translation:
      'From the forest of His matted hair, the celestial Ganga whirls around with restless waves upon His head. With the blazing fire on His forehead burning dhagad-dhagad, may my love for Shiva, who wears the crescent moon on His head, grow every moment.',
    wordMeanings:
      'जटा—matted hair; कटाह—basin; सम्भ्रम—whirling; निलिम्प—celestial; निर्झरी—river; विलोल—restless; वीचि—waves; ललाट—forehead; पट्ट—surface; पावके—in fire; किशोर—young; चन्द्र—moon; शेखरे—on the crest; रतिः—love; मम—my',
  },
  {
    verseNumber: 3,
    sanskrit:
      'धराधरेन्द्रनन्दिनीविलासबन्धुबन्धुर स्फुरद्दिगन्तसन्ततिप्रमोदमानमानसे। कृपाकटाक्षधोरणीनिरुद्धदुर्धरापदि क्वचिद्दिगम्बरे मनो विनोदमेतु वस्तुनि॥',
    transliteration:
      'Dharadharendra nandini vilasa bandhu bandhura, Sphurad diganta santati pramoda mana manase. Kripa kataksha dhorani niruddha durdharapadi, Kvachid digambare mano vinodam etu vastuni.',
    translation:
      'May my mind find delight in Lord Shiva, who is the playful companion of the daughter of the mountain king Parvati, whose mind rejoices in the multitudes across all directions, and whose gracious glance removes all insurmountable troubles.',
    wordMeanings:
      'धराधरेन्द्र—king of mountains; नन्दिनी—daughter (Parvati); विलास—playful; बन्धु—companion; स्फुरत्—shining; दिगन्त—across directions; कृपा—grace; कटाक्ष—glance; दुर्धर—insurmountable; आपदि—in trouble; दिगम्बरे—sky-clad (Shiva); मनो—mind; विनोदम्—delight',
  },
  {
    verseNumber: 4,
    sanskrit:
      'जटाभुजङ्गपिङ्गलस्फुरत्फणामणिप्रभा कदम्बकुङ्कुमद्रवप्रलिप्तदिग्वधूमुखे। मदान्धसिन्धुरस्फुरत्त्वगुत्तरीयमेदुरे मनो विनोदमद्भुतं बिभर्तु भूतभर्तरि॥',
    transliteration:
      'Jata bhujanga pingala sphurat phana mani prabha, Kadamba kunkuma drava pralipta digvadhu mukhe. Madandha sindhura sphurat tvag uttariya medure, Mano vinodam adbhutam bibhartu bhuta bhartari.',
    translation:
      'May my mind hold wonderful delight in Lord Shiva, the protector of all beings, in whose matted hair the tawny serpent shines with its hood-gem radiating like saffron-colored kadamba blossoms anointing the faces of the directions, and who wears an elephant hide as His upper garment.',
    wordMeanings:
      'जटा—matted hair; भुजङ्ग—serpent; पिङ्गल—tawny; फणा—hood; मणि—gem; प्रभा—radiance; कदम्ब—kadamba flower; कुङ्कुम—saffron; सिन्धुर—elephant; त्वक्—skin; उत्तरीय—upper garment; भूत—beings; भर्तरि—in the protector',
  },
  {
    verseNumber: 5,
    sanskrit:
      'सहस्रलोचनप्रभृत्यशेषलेखशेखर प्रसूनधूलिधोरणीविधूसराङ्घ्रिपीठभूः। भुजङ्गराजमालया निबद्धजाटजूटक श्रियै चिराय जायतां चकोरबन्धुशेखरः॥',
    transliteration:
      'Sahasra lochana prabhritya shesha lekha shekhara, Prasuna dhuli dhorani vidhusaranghri pitha bhuh. Bhujanga raja malaya nibaddha jata jutaka, Shriyai chiraya jayatam chakora bandhu shekharah.',
    translation:
      'May Lord Shiva, who wears the moon dear to the Chakora bird on His crest, whose feet are made dusty by the flowers offered by Indra and all other gods, and whose matted hair is bound with the king of serpents, bestow prosperity on us for a long time.',
    wordMeanings:
      'सहस्रलोचन—thousand-eyed (Indra); प्रसून—flower; धूलि—dust; अङ्घ्रि—feet; पीठ—pedestal; भुजङ्गराज—king of serpents; मालया—garland; जाट—matted; जूटक—hair knot; श्रियै—for prosperity; चकोर—Chakora bird; बन्धु—friend; शेखरः—crest',
  },
  {
    verseNumber: 6,
    sanskrit:
      'ललाटचत्वरज्वलद्धनञ्जयस्फुलिङ्गभा- निपीतपञ्चसायकं नमन्निलिम्पनायकम्। सुधामयूखलेखया विराजमानशेखरं महाकपालिसम्पदेशिरोजटालमस्तु नः॥',
    transliteration:
      'Lalata chatvara jvalad dhananjaya sphulingabha, Nipiita pancha sayakam namannilimpa nayakam. Sudha mayukha lekhaya virajamana shekharam, Maha kapali sampad eshiro jatalam astu nah.',
    translation:
      'May Lord Shiva, whose forehead fire burned Kama (the god of desire) with its sparks, before whom the lord of gods bows, who is adorned with the crescent moon with its nectarous rays, and who is the great skull-bearer, bless us.',
    wordMeanings:
      'ललाट—forehead; चत्वर—surface; ज्वलत्—blazing; धनञ्जय—fire; स्फुलिङ्ग—sparks; पञ्चसायकं—five-arrowed (Kamadeva); नमत्—bowing; निलिम्प—celestial; नायकम्—lord; सुधा—nectar; मयूख—rays; लेखया—streak; शेखरं—on the crest; महाकपालि—great skull-bearer',
  },
  {
    verseNumber: 7,
    sanskrit:
      'करालभालपट्टिकाधगद्धगद्धगज्ज्वल- द्धनञ्जयाहुतीकृतप्रचण्डपञ्चसायके। धराधरेन्द्रनन्दिनीकुचाग्रचित्रपत्रक- प्रकल्पनैकशिल्पिनि त्रिलोचने रतिर्मम॥',
    transliteration:
      'Karala bhala pattika dhagad dhagad dhagaj jvala, Ddhananjaya hutikrita prachanda pancha sayake. Dharadharendra nandini kuchagra chitra patraka, Prakalpa naika shilpini trilochane ratir mama.',
    translation:
      'My love is in the three-eyed Lord Shiva, whose fierce forehead blazes dhagad-dhagad consuming Kamadeva in fire, and who is the unique artist painting beautiful designs on the bosom of the daughter of the mountain king.',
    wordMeanings:
      'कराल—fierce; भाल—forehead; पट्टिका—surface; धनञ्जय—fire; आहुति—offering; प्रचण्ड—fierce; पञ्चसायके—five-arrowed (Kama); धराधरेन्द्र—mountain king; नन्दिनी—daughter; कुच—bosom; चित्र—beautiful; पत्रक—design; शिल्पिनि—artist; त्रिलोचने—three-eyed; रतिः—love',
  },
  {
    verseNumber: 8,
    sanskrit:
      'नवीनमेघमण्डलीनिरुद्धदुर्धरस्फुरत् कुहूनिशीथिनीतमःप्रबन्धबन्धुकन्धरः। निलिम्पनिर्झरीधरस्तनोतु कृत्तिसिन्धुरः कलानिधानबन्धुरः श्रियं जगद्धुरन्धरः॥',
    transliteration:
      'Navina megha mandali niruddha durdhara sphurat, Kuhu nishithinii tamah prabandha bandhu kandharah. Nilimpa nirjhari dharas tanotu kritti sindhurah, Kalanidhaana bandurah shriyam jagaddhurandharah.',
    translation:
      'May Lord Shiva, whose neck is as dark as the new dense rain clouds on a moonless night, who bears the celestial river Ganga, who wears an elephant hide, who is beautiful with the crescent moon, and who bears the burden of the universe, bestow prosperity.',
    wordMeanings:
      'नवीन—new; मेघ—cloud; मण्डली—group; कुहू—new moon; निशीथिनी—night; तमः—darkness; कन्धरः—neck; निलिम्प—celestial; निर्झरी—river; कृत्ति—hide; सिन्धुरः—elephant; कलानिधान—receptacle of arts; जगत्—universe; धुरन्धरः—bearer',
  },
  {
    verseNumber: 9,
    sanskrit:
      'प्रफुल्लनीलपङ्कजप्रपञ्चकालिमप्रभा- वलम्बिकण्ठकन्दलीरुचिप्रबद्धकन्धरम्। स्मरच्छिदं पुरच्छिदं भवच्छिदं मखच्छिदं गजच्छिदान्धकच्छिदं तमन्तकच्छिदं भजे॥',
    transliteration:
      'Praphulla nila pankaja prapancha kalima prabha, Valambhi kantha kandali ruchi prabaddha kandharam. Smarachchidam purachchidam bhavachchidam makhachchidam, Gajachchidam andhakachchidam tam antakachchidam bhaje.',
    translation:
      'I worship Lord Shiva, whose neck shines with the radiance like a blooming blue lotus, who is the destroyer of Kamadeva, the destroyer of Tripura, the destroyer of worldly bondage, the disruptor of Daksha\'s sacrifice, the slayer of the elephant demon, the destroyer of Andhaka, and the destroyer of Yama (death).',
    wordMeanings:
      'प्रफुल्ल—blooming; नील—blue; पङ्कज—lotus; कालिम—dark radiance; कण्ठ—throat; कन्दली—like; कन्धरम्—neck; स्मरच्छिदं—destroyer of Kama; पुरच्छिदं—destroyer of Tripura; भवच्छिदं—destroyer of bondage; मखच्छिदं—disruptor of sacrifice; गजच्छिदं—slayer of elephant demon; अन्धकच्छिदं—destroyer of Andhaka; अन्तकच्छिदं—destroyer of death; भजे—I worship',
  },
  {
    verseNumber: 10,
    sanskrit:
      'अखर्वसर्वमङ्गलाकलाकदम्बमञ्जरी रसप्रवाहमाधुरीविजृम्भणामधुव्रतम्। स्मरान्तकं पुरान्तकं भवान्तकं मखान्तकं गजान्तकान्धकान्तकं तमन्तकान्तकं भजे॥',
    transliteration:
      'Akharva sarva mangala kala kadamba manjari, Rasa pravaha madhuri vijrimbhana madhuvratam. Smarantakam purantakam bhavantakam makhantakam, Gajantakandhakantakam tam antakantakam bhaje.',
    translation:
      'I worship Lord Shiva, who is like a bee reveling in the sweet fragrance flowing from the bouquet of auspicious kadamba buds of all arts, who is the ender of Kamadeva, ender of Tripura, ender of worldly cycle, ender of sacrifice, ender of the elephant demon, ender of Andhaka, and the ender of death itself.',
    wordMeanings:
      'अखर्व—great; सर्व—all; मङ्गल—auspicious; कला—arts; कदम्ब—kadamba; मञ्जरी—buds; रस—nectar; प्रवाह—flow; माधुरी—sweetness; मधुव्रतम्—bee; स्मरान्तकं—ender of Kama; पुरान्तकं—ender of Tripura; भवान्तकं—ender of worldly cycle; अन्तकान्तकं—ender of death; भजे—I worship',
  },
  {
    verseNumber: 11,
    sanskrit:
      'द्विनिर्गमत्क्रमस्फुरत्करालभालहव्यवाट् धिमिद्धिमिद्धिमिध्वनन्मृदङ्गतुङ्गमङ्गलम्। ध्वनिक्रमप्रवर्तित प्रचण्डताण्डवः शिवः शिवः स्वयं विभुः करोतु मे श्रियं ताण्डवम्॥',
    transliteration:
      'Dvi nirgamat krama sphurat karala bhala havyavat, Dhimid dhimid dhimidhvanan mridanga tunga mangalam. Dhvanikrama pravartita prachanda tandavah shivah, Shivah svayam vibhuh karotu me shriyam tandavam.',
    translation:
      'Lord Shiva, whose fierce forehead fire blazes forth, who dances the mighty Tandava to the auspicious sounds of the mridanga drum beating dhimid-dhimid-dhimi, may that self-luminous all-pervading Shiva bestow prosperity upon me through His Tandava.',
    wordMeanings:
      'द्वि—two; निर्गमत्—emerging; कराल—fierce; भाल—forehead; हव्यवाट्—fire; धिमिद्—drum sound; मृदङ्ग—drum; तुङ्ग—great; मङ्गलम्—auspicious; प्रचण्ड—mighty; ताण्डव—Tandava dance; शिवः—Shiva; स्वयं—self; विभुः—all-pervading; श्रियं—prosperity',
  },
  {
    verseNumber: 12,
    sanskrit:
      'स्पृषद्विचित्रतल्पयोर्भुजङ्गमौक्तिकस्रजोर् गरिष्ठरत्नलोष्ठयोः सुहृद्विपक्षपक्षयोः। तृणारविन्दचक्षुषोः प्रजामहीमहेन्द्रयोः समप्रवृत्तिकः कदा सदाशिवं भजाम्यहम्॥',
    transliteration:
      'Sprishad vichitra talpayoh bhujanga mauktika srajoh, Garishtha ratna losthayoh suhrid vipaksha pakshayoh. Trina aravinda chakshushoh praja mahi mahendrayoh, Sama pravrittikah kada sadashivam bhajamyaham.',
    translation:
      'When will I worship Lord Sadashiva with equanimity — seeing no difference between a luxurious bed and the bare ground, between snake garlands and pearl necklaces, between precious gems and lumps of earth, between friends and foes, between a blade of grass and a lotus-eyed beauty, between a commoner and a king?',
    wordMeanings:
      'विचित्र—wonderful; तल्प—bed; भुजङ्ग—serpent; मौक्तिक—pearl; स्रजोः—garlands; रत्न—gem; लोष्ठ—lump of earth; सुहृत्—friend; विपक्ष—enemy; तृण—grass; अरविन्द—lotus; चक्षुषोः—eyed; प्रजा—commoner; महेन्द्र—great king; सम—equal; सदाशिवं—eternal Shiva; भजामि—I worship',
  },
  {
    verseNumber: 13,
    sanskrit:
      'कदा निलिम्पनिर्झरीनिकुञ्जकोटरे वसन् विमुक्तदुर्मतिः सदा शिरःस्थमञ्जलिं वहन्। विलोललोललोचनो ललामभाललग्नकः शिवेति मन्त्रमुच्चरन् कदा सुखी भवाम्यहम्॥',
    transliteration:
      'Kada nilimpa nirjhari nikunja kotare vasan, Vimukta durmatih sada shirah stham anjalim vahan. Vilola lola lochano lalama bhala lagnakah, Shiveti mantram ucharan kada sukhi bhavamyaham.',
    translation:
      'When will I be happy, living in a cave near the celestial Ganga, free from evil thoughts, always with my hands in prayer upon my head, with restless eyes gazing at Lord Shiva, with tilaka adorning my forehead, chanting the mantra "Shiva"?',
    wordMeanings:
      'निलिम्प—celestial; निर्झरी—river (Ganga); निकुञ्ज—grove; कोटरे—in a cave; वसन्—living; विमुक्त—freed; दुर्मतिः—evil thoughts; शिरः—head; अञ्जलिं—folded hands; विलोल—restless; लोचनः—eyes; ललाम—tilaka; भाल—forehead; शिव—Shiva; मन्त्रम्—mantra; उच्चरन्—chanting; सुखी—happy',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic random (same approach as Gita seeder)
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
// Parse word meanings
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
      if (word && meaning) pairs.push({ word, meaning });
    }
  }
  return pairs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate 3 quiz questions per stanza
// ─────────────────────────────────────────────────────────────────────────────

const GENERIC_WRONG = [
  'the supreme truth', 'divine weapon', 'sacred river', 'cosmic dance',
  'celestial abode', 'eternal bliss', 'the destroyer of evil', 'universal form',
  'material nature', 'divine grace', 'spiritual liberation', 'path of devotion',
  'holy offering', 'inner peace', 'transcendental power', 'divine chariot',
];

const SHIVA_ATTRIBUTES = [
  'Destroyer of Kama', 'Bearer of Ganga', 'Wearer of crescent moon',
  'Three-eyed Lord', 'Lord of dance (Nataraja)', 'Bearer of the trident',
  'Wearer of serpent garland', 'Dweller of cremation grounds',
  'Destroyer of Tripura', 'Lord of animals (Pashupati)',
  'Sky-clad (Digambara)', 'Bearer of skull', 'Slayer of Andhaka',
];

function generateQuestions(vn, stanza) {
  const questions = [];
  const baseSeed = 5000 + vn;

  // Q1: Word meaning question
  const meanings = parseWordMeanings(stanza.wordMeanings);
  if (meanings.length >= 2) {
    const pickIdx = Math.floor(seededRandom(baseSeed + 10) * meanings.length);
    const picked = meanings[pickIdx];
    const wrongPool = [
      ...meanings.filter((m) => m.word !== picked.word).map((m) => m.meaning),
      ...GENERIC_WRONG,
    ];
    const uniqueWrong = [...new Set(wrongPool)].filter((w) => w !== picked.meaning);
    const wrong = shuffleSeeded(uniqueWrong, baseSeed + 20).slice(0, 3);
    const q1 = placeCorrect(wrong, picked.meaning, baseSeed + 21);
    questions.push({
      question: `In stanza ${vn} of the Shiv Tandav Stotram, what does "${picked.word}" refer to?`,
      options: q1.options,
      correctAnswer: q1.correctIndex,
    });
  } else {
    // Fallback
    const correctAttr = SHIVA_ATTRIBUTES[vn % SHIVA_ATTRIBUTES.length];
    const wrongAttrs = shuffleSeeded(
      SHIVA_ATTRIBUTES.filter((a) => a !== correctAttr),
      baseSeed + 10
    ).slice(0, 3);
    const q1 = placeCorrect(wrongAttrs, correctAttr, baseSeed + 11);
    questions.push({
      question: `Which attribute of Lord Shiva is primarily described in stanza ${vn}?`,
      options: q1.options,
      correctAnswer: q1.correctIndex,
    });
  }

  // Q2: Stanza number identification
  const wrongVerses = [];
  let attempt = 0;
  while (wrongVerses.length < 3 && attempt < 20) {
    const r = Math.floor(seededRandom(baseSeed + 50 + attempt) * 13) + 1;
    if (r !== vn && !wrongVerses.includes(r)) wrongVerses.push(r);
    attempt++;
  }
  const q2 = placeCorrect(
    wrongVerses.map((n) => `Stanza ${n}`),
    `Stanza ${vn}`,
    baseSeed + 51
  );
  questions.push({
    question: `Which stanza of the Shiv Tandav Stotram contains the phrase "${stanza.sanskrit.substring(0, 30)}..."?`,
    options: q2.options,
    correctAnswer: q2.correctIndex,
  });

  // Q3: Translation-based comprehension
  if (meanings.length >= 3) {
    const pickIdx2 = Math.floor(seededRandom(baseSeed + 70) * meanings.length);
    const picked2 = meanings[pickIdx2];
    const wrongPool2 = [
      ...meanings.filter((m) => m.word !== picked2.word).map((m) => m.word),
      'ॐ', 'ब्रह्म', 'माया', 'कर्म',
    ];
    const uniqueWrong2 = [...new Set(wrongPool2)].filter((w) => w !== picked2.word);
    const wrong2 = shuffleSeeded(uniqueWrong2, baseSeed + 80).slice(0, 3);
    const q3 = placeCorrect(wrong2, picked2.word, baseSeed + 81);
    questions.push({
      question: `Which Sanskrit word in stanza ${vn} means "${picked2.meaning}"?`,
      options: q3.options,
      correctAnswer: q3.correctIndex,
    });
  } else {
    questions.push({
      question: `How many stanzas are in the Shiv Tandav Stotram?`,
      options: ['11', '12', '13', '15'],
      correctAnswer: 2,
    });
  }

  return questions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main seeder
// ─────────────────────────────────────────────────────────────────────────────

const seedShivTandav = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const documents = STANZAS.map((s) => ({
      bookId: BOOK_ID,
      chapter: 1,
      verseNumber: s.verseNumber,
      sanskrit: s.sanskrit,
      transliteration: s.transliteration,
      wordMeanings: s.wordMeanings,
      translation: s.translation,
      explanation: '',
      questions: generateQuestions(s.verseNumber, s),
    }));

    // Clear existing Shiv Tandav verses only
    await Verse.deleteMany({ bookId: BOOK_ID });
    console.log('Cleared existing Shiv Tandav Stotram verses');

    await Verse.insertMany(documents);

    console.log('\n========== Seeding Complete ==========');
    console.log(`Book: Shiv Tandav Stotram`);
    console.log(`Total stanzas seeded: ${documents.length}`);
    console.log(`Total quiz questions: ${documents.length * 3}`);
    console.log('======================================\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedShivTandav();
