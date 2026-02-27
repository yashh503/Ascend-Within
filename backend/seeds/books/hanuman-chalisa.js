/**
 * Hanuman Chalisa — 1 chapter, 40 chaupais + 2 dohas (intro) + 1 doha (conclusion) = 43 verses
 *
 * The Hanuman Chalisa ("Forty Verses of Hanuman") was composed by Tulsidas
 * in Awadhi Hindi. It is the most widely recited Hindu devotional hymn.
 *
 * Structure: 2 opening dohas + 40 chaupais + 1 closing doha = 43 verses
 */
const { seededRandom, shuffleSeeded, placeCorrect, parseWordMeanings, GENERIC_WRONG_MEANINGS } = require('../utils/quiz');

const BOOK_ID = 'hanuman-chalisa';

const VERSES = [
  {
    verseNumber: 1,
    sanskrit: 'श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि।\nबरनउँ रघुबर बिमल जसु, जो दायकु फल चारि॥',
    transliteration: 'Shri Guru charan saroj raj, nij manu mukuru sudhari.\nBaranau Raghubar bimal jasu, jo dayaku phal chari.',
    translation: 'After cleansing the mirror of my mind with the dust of the lotus feet of my Guru, I describe the pure glory of Lord Rama, who bestows the four fruits of life (Dharma, Artha, Kama, Moksha).',
    wordMeanings: 'श्रीगुरु—revered Guru; चरन—feet; सरोज—lotus; रज—dust; निज—own; मनु—mind; मुकुरु—mirror; सुधारि—having cleaned; बरनउँ—I describe; रघुबर—best of Raghus (Rama); बिमल—pure; जसु—glory; दायकु—giver; फल—fruits; चारि—four',
  },
  {
    verseNumber: 2,
    sanskrit: 'बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।\nबल बुद्धि बिद्या देहु मोहिं, हरहु कलेस बिकार॥',
    transliteration: 'Buddhiheen tanu jaanike, sumirau Pavan-Kumar.\nBal buddhi bidya dehu mohi, harahu kalesh bikaar.',
    translation: 'Knowing my body to be devoid of intelligence, I remember you, O Hanuman, son of the Wind God. Grant me strength, wisdom, and knowledge, and remove my afflictions and impurities.',
    wordMeanings: 'बुद्धिहीन—devoid of intelligence; तनु—body; जानिके—knowing; सुमिरौं—I remember; पवन-कुमार—son of Wind God (Hanuman); बल—strength; बुद्धि—wisdom; बिद्या—knowledge; देहु—give; मोहिं—to me; हरहु—remove; कलेस—afflictions; बिकार—impurities',
  },
  {
    verseNumber: 3,
    sanskrit: 'जय हनुमान ज्ञान गुन सागर।\nजय कपीस तिहुँ लोक उजागर॥',
    transliteration: 'Jai Hanuman gyan gun sagar.\nJai Kapees tihun lok ujagar.',
    translation: 'Hail Hanuman, ocean of wisdom and virtue. Hail the Lord of monkeys, illuminator of the three worlds.',
    wordMeanings: 'जय—hail/victory; हनुमान—Hanuman; ज्ञान—wisdom; गुन—virtue; सागर—ocean; कपीस—lord of monkeys; तिहुँ—three; लोक—worlds; उजागर—illuminator',
  },
  {
    verseNumber: 4,
    sanskrit: 'राम दूत अतुलित बल धामा।\nअंजनि-पुत्र पवनसुत नामा॥',
    transliteration: 'Ram doot atulit bal dhaama.\nAnjani-putra Pavansut naama.',
    translation: 'You are the divine messenger of Lord Rama with incomparable strength. You are known as Anjani\'s son and the Son of the Wind God.',
    wordMeanings: 'राम—Rama; दूत—messenger; अतुलित—incomparable; बल—strength; धामा—abode; अंजनि—Anjani; पुत्र—son; पवनसुत—son of wind; नामा—named',
  },
  {
    verseNumber: 5,
    sanskrit: 'महाबीर बिक्रम बजरंगी।\nकुमति निवार सुमति के संगी॥',
    transliteration: 'Mahabeer bikram Bajrangi.\nKumati nivaar sumati ke sangi.',
    translation: 'O great hero, mighty one with a body like a thunderbolt! You dispel evil thoughts and are the companion of good intellect.',
    wordMeanings: 'महाबीर—great hero; बिक्रम—valiant; बजरंगी—with body like thunderbolt; कुमति—evil thoughts; निवार—dispeller; सुमति—good intellect; संगी—companion',
  },
  {
    verseNumber: 6,
    sanskrit: 'कंचन बरन बिराज सुबेसा।\nकानन कुण्डल कुँचित केसा॥',
    transliteration: 'Kanchan baran biraaj subesaa.\nKaanan kundal kunchit kesaa.',
    translation: 'Your golden-colored form shines in beautiful attire. You wear earrings and have curly hair.',
    wordMeanings: 'कंचन—golden; बरन—color; बिराज—shining; सुबेसा—beautiful attire; कानन—ear; कुण्डल—earrings; कुँचित—curly; केसा—hair',
  },
  {
    verseNumber: 7,
    sanskrit: 'हाथ बज्र औ ध्वजा बिराजे।\nकाँधे मूँज जनेऊ साजे॥',
    transliteration: 'Haath bajra au dhvaja biraaje.\nKaandhe moonj janeu saaje.',
    translation: 'In your hands shine the thunderbolt mace and a banner. On your shoulder adorns the sacred thread made of munja grass.',
    wordMeanings: 'हाथ—hand; बज्र—thunderbolt; ध्वजा—banner; बिराजे—shining; काँधे—shoulder; मूँज—munja grass; जनेऊ—sacred thread; साजे—adorning',
  },
  {
    verseNumber: 8,
    sanskrit: 'शंकर सुवन केसरीनन्दन।\nतेज प्रताप महा जग बन्दन॥',
    transliteration: 'Shankar suvan Kesarinandan.\nTej prataap maha jag bandan.',
    translation: 'You are an incarnation of Lord Shiva, the delight of Kesari. Your radiance and glory are immense, and the whole world worships you.',
    wordMeanings: 'शंकर—Shiva; सुवन—incarnation; केसरीनन्दन—delight of Kesari; तेज—radiance; प्रताप—glory; महा—great; जग—world; बन्दन—worshipped',
  },
  {
    verseNumber: 9,
    sanskrit: 'बिद्यावान गुनी अति चातुर।\nराम काज करिबे को आतुर॥',
    transliteration: 'Bidyavaan guni ati chaatur.\nRam kaaj karibe ko aatur.',
    translation: 'You are full of learning, virtuous, and extremely clever. You are always eager to carry out Lord Rama\'s work.',
    wordMeanings: 'बिद्यावान—learned; गुनी—virtuous; अति—extremely; चातुर—clever; राम—Rama; काज—work; करिबे—to do; आतुर—eager',
  },
  {
    verseNumber: 10,
    sanskrit: 'प्रभु चरित्र सुनिबे को रसिया।\nराम लखन सीता मन बसिया॥',
    transliteration: 'Prabhu charitra sunibe ko rasiya.\nRam Lakhan Sita man basiya.',
    translation: 'You delight in listening to the tales of the Lord. Rama, Lakshmana, and Sita dwell in your heart.',
    wordMeanings: 'प्रभु—Lord; चरित्र—tales; सुनिबे—listening; रसिया—one who delights; राम—Rama; लखन—Lakshmana; सीता—Sita; मन—heart; बसिया—dwelling',
  },
  {
    verseNumber: 11,
    sanskrit: 'सूक्ष्म रूप धरि सियहिं दिखावा।\nबिकट रूप धरि लंक जरावा॥',
    transliteration: 'Sukshma roop dhari Siyahin dikhaava.\nBikat roop dhari Lanka jaraava.',
    translation: 'Assuming a tiny form, you appeared before Sita. Assuming a fierce form, you set Lanka on fire.',
    wordMeanings: 'सूक्ष्म—tiny; रूप—form; धरि—assuming; सियहिं—to Sita; दिखावा—showed; बिकट—fierce; लंक—Lanka; जरावा—set on fire',
  },
  {
    verseNumber: 12,
    sanskrit: 'भीम रूप धरि असुर संहारे।\nरामचन्द्र के काज सँवारे॥',
    transliteration: 'Bheem roop dhari asur sanhaare.\nRamchandra ke kaaj sanvaare.',
    translation: 'Assuming a terrifying form, you destroyed the demons and accomplished all of Lord Rama\'s tasks.',
    wordMeanings: 'भीम—terrifying; रूप—form; धरि—assuming; असुर—demons; संहारे—destroyed; रामचन्द्र—Lord Rama; काज—tasks; सँवारे—accomplished',
  },
  {
    verseNumber: 13,
    sanskrit: 'लाय सजीवन लखन जियाये।\nश्रीरघुबीर हरषि उर लाये॥',
    transliteration: 'Laay Sajeevan Lakhan jiyaaye.\nShri Raghubeer harashi ur laaye.',
    translation: 'You brought the Sanjeevani herb and revived Lakshmana. Lord Rama embraced you joyfully.',
    wordMeanings: 'लाय—bringing; सजीवन—Sanjeevani; लखन—Lakshmana; जियाये—revived; श्रीरघुबीर—Lord Rama; हरषि—joyfully; उर—chest; लाये—embraced',
  },
  {
    verseNumber: 14,
    sanskrit: 'रघुपति कीन्हीं बहुत बड़ाई।\nतुम मम प्रिय भरतहि सम भाई॥',
    transliteration: 'Raghupati keenhi bahut badai.\nTum mam priya Bharatahi sam bhai.',
    translation: 'Lord Rama praised you greatly and said: "You are dear to me as my brother Bharata."',
    wordMeanings: 'रघुपति—Lord Rama; कीन्हीं—did; बहुत—much; बड़ाई—praise; तुम—you; मम—my; प्रिय—dear; भरतहि—Bharata; सम—like; भाई—brother',
  },
  {
    verseNumber: 15,
    sanskrit: 'सहस बदन तुम्हरो जस गावैं।\nअस कहि श्रीपति कण्ठ लगावैं॥',
    transliteration: 'Sahas badan tumharo jas gaavai.\nAs kahi Shripati kanth lagaavai.',
    translation: '"Even Shesha with his thousand heads sings your glory," saying this, Lord Rama embraced you.',
    wordMeanings: 'सहस—thousand; बदन—mouths; तुम्हरो—your; जस—glory; गावैं—sings; अस—thus; कहि—saying; श्रीपति—Lord of Lakshmi (Rama); कण्ठ—neck; लगावैं—embraced',
  },
  {
    verseNumber: 16,
    sanskrit: 'सनकादिक ब्रह्मादि मुनीसा।\nनारद सारद सहित अहीसा॥',
    transliteration: 'Sanakadik Brahmadi Muneesa.\nNarad Sarad sahit Aheesa.',
    translation: 'Sanaka and the other sages, Brahma and the gods, Narada, Saraswati, and Shesha — all sing your glory.',
    wordMeanings: 'सनकादिक—Sanaka and others; ब्रह्मादि—Brahma and others; मुनीसा—great sages; नारद—Narada; सारद—Saraswati; सहित—along with; अहीसा—king of serpents (Shesha)',
  },
  {
    verseNumber: 17,
    sanskrit: 'जम कुबेर दिगपाल जहाँ ते।\nकबि कोबिद कहि सके कहाँ ते॥',
    transliteration: 'Jam Kuber Digpaal jahaan te.\nKabi kobid kahi sake kahaan te.',
    translation: 'Yama, Kubera, and the guardians of the directions — even poets and scholars cannot fully describe your glory.',
    wordMeanings: 'जम—Yama; कुबेर—Kubera; दिगपाल—guardians of directions; जहाँ ते—wherever; कबि—poets; कोबिद—scholars; कहि—describe; सके—can; कहाँ ते—how much',
  },
  {
    verseNumber: 18,
    sanskrit: 'तुम उपकार सुग्रीवहिं कीन्हा।\nराम मिलाय राजपद दीन्हा॥',
    transliteration: 'Tum upkaar Sugreevahin keenhaa.\nRam milaay rajpad deenhaa.',
    translation: 'You rendered great service to Sugriva. You united him with Rama and restored his kingship.',
    wordMeanings: 'तुम—you; उपकार—service; सुग्रीवहिं—to Sugriva; कीन्हा—rendered; राम—Rama; मिलाय—uniting; राजपद—kingship; दीन्हा—gave',
  },
  {
    verseNumber: 19,
    sanskrit: 'तुम्हरो मन्त्र बिभीषन माना।\nलंकेश्वर भए सब जग जाना॥',
    transliteration: 'Tumharo mantra Vibheeshan maanaa.\nLankeshwar bhaye sab jag jaanaa.',
    translation: 'Vibhishana followed your counsel and became the Lord of Lanka, as the whole world knows.',
    wordMeanings: 'तुम्हरो—your; मन्त्र—counsel; बिभीषन—Vibhishana; माना—followed; लंकेश्वर—Lord of Lanka; भए—became; सब—all; जग—world; जाना—knows',
  },
  {
    verseNumber: 20,
    sanskrit: 'जुग सहस्र जोजन पर भानू।\nलील्यो ताहि मधुर फल जानू॥',
    transliteration: 'Jug sahasra jojan par Bhaanu.\nLeelyo taahi madhur phal jaanu.',
    translation: 'The sun, which is thousands of yojanas away, you swallowed it thinking it to be a sweet fruit.',
    wordMeanings: 'जुग—era; सहस्र—thousand; जोजन—yojanas (distance); पर—away; भानू—sun; लील्यो—swallowed; ताहि—that; मधुर—sweet; फल—fruit; जानू—thinking',
  },
  {
    verseNumber: 21,
    sanskrit: 'प्रभु मुद्रिका मेलि मुख माहीं।\nजलधि लाँघि गये अचरज नाहीं॥',
    transliteration: 'Prabhu mudrika meli mukh maahi.\nJaladhi laanghi gaye achraj naahi.',
    translation: 'Carrying the Lord\'s ring in your mouth, you leapt across the ocean — no surprise in that.',
    wordMeanings: 'प्रभु—Lord\'s; मुद्रिका—ring; मेलि—placing; मुख—mouth; माहीं—in; जलधि—ocean; लाँघि—leapt across; गये—went; अचरज—surprise; नाहीं—not',
  },
  {
    verseNumber: 22,
    sanskrit: 'दुर्गम काज जगत के जेते।\nसुगम अनुग्रह तुम्हरे तेते॥',
    transliteration: 'Durgam kaaj jagat ke jete.\nSugam anugrah tumhare tete.',
    translation: 'All the difficult tasks of the world become easy by your grace.',
    wordMeanings: 'दुर्गम—difficult; काज—tasks; जगत—world; जेते—whatever; सुगम—easy; अनुग्रह—grace; तुम्हरे—your; तेते—by that',
  },
  {
    verseNumber: 23,
    sanskrit: 'राम दुआरे तुम रखवारे।\nहोत न आज्ञा बिनु पैसारे॥',
    transliteration: 'Ram duaare tum rakhvaare.\nHot na aagya binu paisaare.',
    translation: 'You are the guardian at the door of Lord Rama. None can enter without your permission.',
    wordMeanings: 'राम—Rama; दुआरे—at the door; तुम—you; रखवारे—guardian; होत—happens; आज्ञा—permission; बिनु—without; पैसारे—entry',
  },
  {
    verseNumber: 24,
    sanskrit: 'सब सुख लहैं तुम्हारी सरना।\nतुम रक्षक काहू को डर ना॥',
    transliteration: 'Sab sukh lahai tumhaari sarnaa.\nTum rakshak kaahu ko dar naa.',
    translation: 'All happiness is found in your refuge. With you as protector, there is nothing to fear.',
    wordMeanings: 'सब—all; सुख—happiness; लहैं—obtain; तुम्हारी—your; सरना—refuge; तुम—you; रक्षक—protector; काहू—anyone; डर—fear; ना—no',
  },
  {
    verseNumber: 25,
    sanskrit: 'आपन तेज सम्हारो आपै।\nतीनों लोक हाँक तें काँपै॥',
    transliteration: 'Aapan tej samhaaro aapai.\nTeenon lok haank te kaampai.',
    translation: 'Only you can control your own radiance. The three worlds tremble at your roar.',
    wordMeanings: 'आपन—own; तेज—radiance; सम्हारो—control; आपै—yourself; तीनों—three; लोक—worlds; हाँक—roar; काँपै—tremble',
  },
  {
    verseNumber: 26,
    sanskrit: 'भूत पिसाच निकट नहिं आवै।\nमहाबीर जब नाम सुनावै॥',
    transliteration: 'Bhoot pisaach nikat nahin aavai.\nMahabeer jab naam sunaavai.',
    translation: 'Ghosts and evil spirits dare not come near when one chants your name, O Mighty One.',
    wordMeanings: 'भूत—ghosts; पिसाच—evil spirits; निकट—near; नहिं—not; आवै—come; महाबीर—great hero; जब—when; नाम—name; सुनावै—chanting',
  },
  {
    verseNumber: 27,
    sanskrit: 'नासै रोग हरै सब पीरा।\nजपत निरन्तर हनुमत बीरा॥',
    transliteration: 'Naasai rog harai sab peeraa.\nJapat nirantar Hanumat beeraa.',
    translation: 'All diseases are destroyed, all pain is removed, by continuously chanting the name of brave Hanuman.',
    wordMeanings: 'नासै—destroyed; रोग—diseases; हरै—removes; सब—all; पीरा—pain; जपत—chanting; निरन्तर—continuously; हनुमत—Hanuman; बीरा—brave',
  },
  {
    verseNumber: 28,
    sanskrit: 'संकट तें हनुमान छुड़ावै।\nमन क्रम बचन ध्यान जो लावै॥',
    transliteration: 'Sankat te Hanumaan chudaavai.\nMan kram bachan dhyaan jo laavai.',
    translation: 'Hanuman frees from all troubles those who meditate on him in thought, deed, and word.',
    wordMeanings: 'संकट—troubles; हनुमान—Hanuman; छुड़ावै—frees; मन—mind; क्रम—deed; बचन—word; ध्यान—meditation; लावै—applies',
  },
  {
    verseNumber: 29,
    sanskrit: 'सब पर राम तपस्वी राजा।\nतिन के काज सकल तुम साजा॥',
    transliteration: 'Sab par Ram tapasvi raajaa.\nTin ke kaaj sakal tum saajaa.',
    translation: 'Lord Rama, the ascetic king, reigns over all. You carry out all his tasks.',
    wordMeanings: 'सब—all; पर—over; राम—Rama; तपस्वी—ascetic; राजा—king; तिन—his; काज—tasks; सकल—all; तुम—you; साजा—accomplished',
  },
  {
    verseNumber: 30,
    sanskrit: 'और मनोरथ जो कोई लावै।\nसोइ अमित जीवन फल पावै॥',
    transliteration: 'Aur manorath jo koi laavai.\nSoi amit jeevan phal paavai.',
    translation: 'Whoever brings any desire to you, they obtain the limitless fruits of life.',
    wordMeanings: 'और—any; मनोरथ—desire; जो—whoever; कोई—anyone; लावै—brings; सोइ—that one; अमित—limitless; जीवन—life; फल—fruits; पावै—obtains',
  },
  {
    verseNumber: 31,
    sanskrit: 'चारों जुग परताप तुम्हारा।\nहै परसिद्ध जगत उजियारा॥',
    transliteration: 'Chaaron jug partaap tumhaaraa.\nHai parsiddh jagat ujiyaaraa.',
    translation: 'Your glory pervades all four ages. Your fame illuminates the whole world.',
    wordMeanings: 'चारों—four; जुग—ages; परताप—glory; तुम्हारा—your; है—is; परसिद्ध—famous; जगत—world; उजियारा—illuminating',
  },
  {
    verseNumber: 32,
    sanskrit: 'साधु सन्त के तुम रखवारे।\nअसुर निकन्दन राम दुलारे॥',
    transliteration: 'Saadhu sant ke tum rakhvaare.\nAsur nikandan Ram dulaare.',
    translation: 'You are the protector of saints and sages, the destroyer of demons, and the beloved of Lord Rama.',
    wordMeanings: 'साधु—holy; सन्त—saints; रखवारे—protector; असुर—demons; निकन्दन—destroyer; राम—Rama; दुलारे—beloved',
  },
  {
    verseNumber: 33,
    sanskrit: 'अष्ट सिद्धि नौ निधि के दाता।\nअस बर दीन जानकी माता॥',
    transliteration: 'Ashta siddhi nau nidhi ke daata.\nAs bar deen Janaki maata.',
    translation: 'You can grant the eight siddhis and nine nidhis. Mother Sita has given you this boon.',
    wordMeanings: 'अष्ट—eight; सिद्धि—supernatural powers; नौ—nine; निधि—treasures; दाता—giver; अस—such; बर—boon; दीन—given; जानकी—Sita; माता—mother',
  },
  {
    verseNumber: 34,
    sanskrit: 'राम रसायन तुम्हरे पासा।\nसदा रहो रघुपति के दासा॥',
    transliteration: 'Ram rasaayan tumhare paasaa.\nSadaa raho Raghupati ke daasaa.',
    translation: 'You hold the essence of devotion to Rama. You are forever the servant of Lord Rama.',
    wordMeanings: 'राम—Rama; रसायन—elixir/essence; तुम्हरे—your; पासा—possession; सदा—forever; रहो—remain; रघुपति—Lord Rama; दासा—servant',
  },
  {
    verseNumber: 35,
    sanskrit: 'तुम्हरे भजन राम को पावै।\nजनम जनम के दुख बिसरावै॥',
    transliteration: 'Tumhare bhajan Ram ko paavai.\nJanam janam ke dukh bisraavai.',
    translation: 'By worshipping you, one attains Lord Rama and forgets the sorrows of many lifetimes.',
    wordMeanings: 'तुम्हरे—your; भजन—worship; राम—Rama; पावै—attains; जनम—birth; दुख—sorrow; बिसरावै—forgets',
  },
  {
    verseNumber: 36,
    sanskrit: 'अन्तकाल रघुबर पुर जाई।\nजहाँ जन्म हरिभक्त कहाई॥',
    transliteration: 'Antkaal Raghubar pur jaai.\nJahaan janm Haribhakt kahaai.',
    translation: 'At the time of death, one goes to the abode of Lord Rama. And wherever one is born, one is known as a devotee of Hari.',
    wordMeanings: 'अन्तकाल—at the end; रघुबर—Lord Rama; पुर—abode; जाई—goes; जहाँ—wherever; जन्म—birth; हरिभक्त—devotee of Hari; कहाई—called',
  },
  {
    verseNumber: 37,
    sanskrit: 'और देवता चित्त न धरई।\nहनुमत सेइ सर्ब सुख करई॥',
    transliteration: 'Aur devtaa chitt na dharai.\nHanumat sei sarba sukh karai.',
    translation: 'Even without worshipping any other deity, one who serves Hanuman attains all happiness.',
    wordMeanings: 'और—other; देवता—deities; चित्त—mind; धरई—keeping; हनुमत—Hanuman; सेइ—serving; सर्ब—all; सुख—happiness; करई—gives',
  },
  {
    verseNumber: 38,
    sanskrit: 'संकट कटै मिटै सब पीरा।\nजो सुमिरै हनुमत बलबीरा॥',
    transliteration: 'Sankat katai mitai sab peeraa.\nJo sumirai Hanumat Balbeeraa.',
    translation: 'All troubles are cut away and all pain is removed for one who remembers the mighty hero Hanuman.',
    wordMeanings: 'संकट—troubles; कटै—cut; मिटै—removed; सब—all; पीरा—pain; जो—who; सुमिरै—remembers; हनुमत—Hanuman; बलबीरा—mighty hero',
  },
  {
    verseNumber: 39,
    sanskrit: 'जै जै जै हनुमान गोसाईं।\nकृपा करहु गुरुदेव की नाईं॥',
    transliteration: 'Jai jai jai Hanuman Gosaain.\nKripa karahu Gurudev ki naain.',
    translation: 'Victory, victory, victory to Lord Hanuman! Bestow your grace upon me, as my Guru does.',
    wordMeanings: 'जै—victory; हनुमान—Hanuman; गोसाईं—Lord; कृपा—grace; करहु—bestow; गुरुदेव—Guru; नाईं—like',
  },
  {
    verseNumber: 40,
    sanskrit: 'जो सत बार पाठ कर कोई।\nछूटहि बंदि महा सुख होई॥',
    transliteration: 'Jo sat baar paath kar koi.\nChootahi bandi maha sukh hoi.',
    translation: 'One who recites this a hundred times is freed from bondage and attains great happiness.',
    wordMeanings: 'जो—who; सत—hundred; बार—times; पाठ—recitation; कर—does; कोई—anyone; छूटहि—freed; बंदि—bondage; महा—great; सुख—happiness; होई—attains',
  },
  {
    verseNumber: 41,
    sanskrit: 'जो यह पढ़ै हनुमान चालीसा।\nहोय सिद्धि साखी गौरीसा॥',
    transliteration: 'Jo yah padhai Hanuman Chaaleesaa.\nHoy siddhi saakhi Gaureesaa.',
    translation: 'One who reads this Hanuman Chalisa attains perfection — Lord Shiva is witness to this.',
    wordMeanings: 'जो—who; यह—this; पढ़ै—reads; हनुमान चालीसा—Hanuman Chalisa; होय—attains; सिद्धि—perfection; साखी—witness; गौरीसा—Lord Shiva',
  },
  {
    verseNumber: 42,
    sanskrit: 'तुलसीदास सदा हरि चेरा।\nकीजै नाथ हृदय महँ डेरा॥',
    transliteration: 'Tulaseedas sadaa Hari cheraa.\nKeejai naath hriday mahan deraa.',
    translation: 'Tulsidas, forever the servant of Hari, prays: O Lord, make my heart your dwelling place.',
    wordMeanings: 'तुलसीदास—Tulsidas; सदा—forever; हरि—Hari; चेरा—servant; कीजै—make; नाथ—Lord; हृदय—heart; महँ—in; डेरा—dwelling',
  },
  {
    verseNumber: 43,
    sanskrit: 'पवनतनय संकट हरन, मंगल मूरति रूप।\nराम लखन सीता सहित, हृदय बसहु सुर भूप॥',
    transliteration: 'Pavantanay sankat haran, mangal moorti roop.\nRam Lakhan Sita sahit, hriday basahu sur bhoop.',
    translation: 'O Son of the Wind, remover of all troubles, embodiment of auspiciousness — along with Rama, Lakshmana, and Sita, please dwell in my heart, O King of the Gods.',
    wordMeanings: 'पवनतनय—son of Wind; संकट—troubles; हरन—remover; मंगल—auspicious; मूरति—form; रूप—embodiment; राम—Rama; लखन—Lakshmana; सीता—Sita; सहित—along with; हृदय—heart; बसहु—dwell; सुर—gods; भूप—king',
  },
];

const HANUMAN_ATTRIBUTES = [
  'Son of the Wind God', 'Messenger of Rama', 'Destroyer of demons',
  'Bearer of Sanjeevani', 'Guardian of Rama\'s door', 'Protector of saints',
  'Swallower of the Sun', 'Leaper across the ocean', 'Incarnation of Shiva',
  'Devotee of Rama', 'Granter of eight siddhis', 'Embodiment of auspiciousness',
  'Companion of good intellect',
];

function generateQuestions(vn, verse) {
  const questions = [];
  const baseSeed = 7000 + vn;

  // Q1: Word meaning
  const meanings = parseWordMeanings(verse.wordMeanings);
  if (meanings.length >= 2) {
    const pickIdx = Math.floor(seededRandom(baseSeed + 10) * meanings.length);
    const picked = meanings[pickIdx];
    const wrongPool = [
      ...meanings.filter((m) => m.word !== picked.word).map((m) => m.meaning),
      ...GENERIC_WRONG_MEANINGS,
    ];
    const uniqueWrong = [...new Set(wrongPool)].filter((w) => w !== picked.meaning);
    const wrong = shuffleSeeded(uniqueWrong, baseSeed + 20).slice(0, 3);
    const q1 = placeCorrect(wrong, picked.meaning, baseSeed + 21);
    questions.push({
      question: `In verse ${vn} of the Hanuman Chalisa, what does "${picked.word}" mean?`,
      options: q1.options,
      correctAnswer: q1.correctIndex,
    });
  } else {
    const correctAttr = HANUMAN_ATTRIBUTES[vn % HANUMAN_ATTRIBUTES.length];
    const wrongAttrs = shuffleSeeded(
      HANUMAN_ATTRIBUTES.filter((a) => a !== correctAttr), baseSeed + 10
    ).slice(0, 3);
    const q1 = placeCorrect(wrongAttrs, correctAttr, baseSeed + 11);
    questions.push({
      question: `Which quality of Hanuman is described in verse ${vn}?`,
      options: q1.options,
      correctAnswer: q1.correctIndex,
    });
  }

  // Q2: Verse identification
  const wrongVerses = [];
  let attempt = 0;
  while (wrongVerses.length < 3 && attempt < 20) {
    const r = Math.floor(seededRandom(baseSeed + 50 + attempt) * 43) + 1;
    if (r !== vn && !wrongVerses.includes(r)) wrongVerses.push(r);
    attempt++;
  }
  const q2 = placeCorrect(
    wrongVerses.map((n) => `Verse ${n}`),
    `Verse ${vn}`,
    baseSeed + 51
  );
  questions.push({
    question: `Which verse of the Hanuman Chalisa contains: "${verse.sanskrit.substring(0, 25)}..."?`,
    options: q2.options,
    correctAnswer: q2.correctIndex,
  });

  // Q3: Reverse word lookup
  if (meanings.length >= 3) {
    const pickIdx2 = Math.floor(seededRandom(baseSeed + 70) * meanings.length);
    const picked2 = meanings[pickIdx2];
    const wrongPool2 = [
      ...meanings.filter((m) => m.word !== picked2.word).map((m) => m.word),
    ];
    const uniqueWrong2 = [...new Set(wrongPool2)].filter((w) => w !== picked2.word);
    const wrong2 = shuffleSeeded(uniqueWrong2, baseSeed + 80).slice(0, 3);
    const q3 = placeCorrect(wrong2, picked2.word, baseSeed + 81);
    questions.push({
      question: `Which word in verse ${vn} means "${picked2.meaning}"?`,
      options: q3.options,
      correctAnswer: q3.correctIndex,
    });
  } else {
    questions.push({
      question: 'How many chaupais are in the Hanuman Chalisa?',
      options: ['36', '40', '42', '48'],
      correctAnswer: 1,
    });
  }

  return questions;
}

function getVerses() {
  return VERSES.map((v) => ({
    bookId: BOOK_ID,
    chapter: 1,
    verseNumber: v.verseNumber,
    sanskrit: v.sanskrit,
    transliteration: v.transliteration,
    wordMeanings: v.wordMeanings,
    translation: v.translation,
    translations: { en: v.translation, hi: '' },
    explanation: '',
    questions: generateQuestions(v.verseNumber, v),
  }));
}

module.exports = { bookId: BOOK_ID, getVerses };
