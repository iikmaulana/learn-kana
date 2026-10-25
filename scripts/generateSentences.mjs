/*
 * Generates src/generatedSentences.js for the "sentences" (long typing)
 * practice mode.
 *
 * Every sentence is built from curated N5 word banks combined through fixed
 * grammar templates, so each result is a correct Japanese sentence:
 *   [person] は [object] を [verb],  [place] に [thing] が あります, ...
 * Words, particles and verb tenses are hand-written (は = wa, を = wo/o,
 * へ = e, past = ました), and every character is validated against the
 * kana/kanji taught in src/kanaCharacters.js.
 *
 * Run with:  node scripts/generateSentences.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

// ---------- Allowed characters (everything taught in kanaCharacters.js) ----------
// The data of kanaCharacters.js is in src/data (see its README.md). The N4
// kanji (src/data/kanji/n4.json) are not allowed yet: the word banks only
// use the kana, the words and the N5 kanji.
const readJson = (relative) => JSON.parse(read(relative));
const hiraganaData = readJson('src/data/kana/hiragana.json');
const katakanaData = readJson('src/data/kana/katakana.json');
const wordsData = readJson('src/data/words.json');
const n5KanjiData = readJson('src/data/kanji/n5.json');
const allowedKanji = new Set(
  [
    ...[hiraganaData, katakanaData].flatMap(groups => Object.values(groups).flatMap(group => Object.values(group.characters))),
    ...Object.values(wordsData),
    ...n5KanjiData.kanji,
  ]
    .map(entry => entry.jp_character)
    .filter(value => [...value].length === 1)
);
const isAllowedCharacter = (character) =>
  /[\u3040-\u30ff\u3001]/.test(character) || allowedKanji.has(character);

// ---------- Word banks ----------
// Verb tenses: base (ます form), past (ました form), EN present/past/future
const verb = (jp, ro, jpPast, roPast, en, en3, enFut, enPast, id) =>
  ({ jp, ro, jpPast, roPast, en, en3, enFut, enPast, id });

const drink = verb('飲みます', 'nomimasu', '飲みました', 'nomimashita', 'drink', 'drinks', 'will drink', 'drank', 'minum');
const eat = verb('食べます', 'tabemasu', '食べました', 'tabemashita', 'eat', 'eats', 'will eat', 'ate', 'makan');
const readV = verb('読みます', 'yomimasu', '読みました', 'yomimashita', 'read', 'reads', 'will read', 'read', 'membaca');
const writeV = verb('書きます', 'kakimasu', '書きました', 'kakimashita', 'write', 'writes', 'will write', 'wrote', 'menulis');
const watchV = verb('見ます', 'mimasu', '見ました', 'mimashita', 'watch', 'watches', 'will watch', 'watched', 'menonton');
const buy = verb('買います', 'kaimasu', '買いました', 'kaimashita', 'buy', 'buys', 'will buy', 'bought', 'membeli');
const listen = verb('聞きます', 'kikimasu', '聞きました', 'kikimashita', 'listen to', 'listens to', 'will listen to', 'listened to', 'mendengarkan');
const speak = verb('話します', 'hanashimasu', '話しました', 'hanashimashita', 'speak', 'speaks', 'will speak', 'spoke', 'berbicara');
const meet = verb('会います', 'aimasu', '会いました', 'aimashita', 'meet', 'meets', 'will meet', 'met', 'bertemu');
const study = verb('べんきょうします', 'benkyou shimasu', 'べんきょうしました', 'benkyou shimashita', 'study', 'studies', 'will study', 'studied', 'belajar');
const go = verb('行きます', 'ikimasu', '行きました', 'ikimashita', 'go', 'goes', 'will go', 'went', 'pergi');
const come = verb('来ます', 'kimasu', '来ました', 'kimashita', 'come', 'comes', 'will come', 'came', 'datang');
const returnHome = verb('帰ります', 'kaerimasu', '帰りました', 'kaerimashita', 'return home', 'returns home', 'will return home', 'returned home', 'pulang ke rumah');

// People: sub (I/you/third person), third person verb form flag, possessive
const person = (jp, ro, en, id, third, enPoss, idPoss) => ({ jp, ro, en, id, third, enPoss, idPoss });
const watashi = person('わたし', 'watashi', 'I', 'Saya', false, 'My', 'saya');
const anata = person('あなた', 'anata', 'You', 'Anda', false, 'Your', 'Anda');
const gakusei = person('学生', 'gakusei', 'the student', 'Pelajar', true, "the student's", 'pelajar');
const sensei = person('先生', 'sensei', 'the teacher', 'Guru', true, "the teacher's", 'guru');
const tomodachi = person('友だち', 'tomodachi', 'my friend', 'Teman saya', true, "my friend's", 'teman saya');
const chichi = person('父', 'chichi', 'my father', 'Ayah saya', true, "my father's", 'ayah saya');
const haha = person('母', 'haha', 'my mother', 'Ibu saya', true, "my mother's", 'ibu saya');
const otokonoko = person('男の子', 'otokonoko', 'the boy', 'Anak laki-laki', true, "the boy's", 'anak laki-laki');
const onnanoko = person('女の子', 'onnanoko', 'the girl', 'Anak perempuan', true, "the girl's", 'anak perempuan');

// Places: noun forms + ready-made "to ..." / "at, in ..." phrases
const place = (jp, ro, enNoun, idNoun, enTo, idTo, enAt, idAt) =>
  ({ jp, ro, enNoun, idNoun, enTo, idTo, enAt, idAt });
const school = place('学校', 'gakkou', 'the school', 'sekolah', 'to school', 'ke sekolah', 'at school', 'di sekolah');
const station = place('駅', 'eki', 'the station', 'stasiun', 'to the station', 'ke stasiun', 'at the station', 'di stasiun');
const shop = place('店', 'mise', 'the shop', 'toko', 'to the shop', 'ke toko', 'at the shop', 'di toko');
const departmentStore = place('デパート', 'depaato', 'the department store', 'toko serba ada', 'to the department store', 'ke toko serba ada', 'at the department store', 'di toko serba ada');
const supermarket = place('スーパー', 'suupaa', 'the supermarket', 'supermarket', 'to the supermarket', 'ke supermarket', 'at the supermarket', 'di supermarket');
const park = place('こうえん', 'kouen', 'the park', 'taman', 'to the park', 'ke taman', 'in the park', 'di taman');
const mountain = place('山', 'yama', 'the mountain', 'gunung', 'to the mountain', 'ke gunung', 'on the mountain', 'di gunung');
const river = place('川', 'kawa', 'the river', 'sungai', 'to the river', 'ke sungai', 'in the river', 'di sungai');
const japan = place('日本', 'nihon', 'Japan', 'Jepang', 'to Japan', 'ke Jepang', 'in Japan', 'di Jepang');
const foreignCountry = place('外国', 'gaikoku', 'a foreign country', 'luar negeri', 'to a foreign country', 'ke luar negeri', 'in a foreign country', 'di luar negeri');
const home = place('うち', 'uchi', 'home', 'rumah', 'home', 'ke rumah', 'at home', 'di rumah');
const restaurant = place('レストラン', 'resutoran', 'the restaurant', 'restoran', 'to the restaurant', 'ke restoran', 'at the restaurant', 'di restoran');
const room = place('へや', 'heya', 'the room', 'kamar', 'to the room', 'ke kamar', 'in the room', 'di kamar');

// Objects: noun + English/Indonesian forms
const obj = (jp, ro, en, id) => ({ jp, ro, en, id });
const mizu = obj('水', 'mizu', 'water', 'air');
const ocha = obj('おちゃ', 'ocha', 'tea', 'teh');
const coffee = obj('コーヒー', 'koohii', 'coffee', 'kopi');
const milk = obj('ぎゅうにゅう', 'gyuunyuu', 'milk', 'susu');
const gohan = obj('ごはん', 'gohan', 'rice', 'nasi');
const asagohan = obj('あさごはん', 'asagohan', 'breakfast', 'sarapan');
const pan = obj('パン', 'pan', 'bread', 'roti');
const fish = obj('さかな', 'sakana', 'fish', 'ikan');
const meat = obj('にく', 'niku', 'meat', 'daging');
const egg = obj('たまご', 'tamago', 'an egg', 'telur');
const ramen = obj('ラーメン', 'raamen', 'ramen', 'ramen');
const sushi = obj('すし', 'sushi', 'sushi', 'sushi');
const apple = obj('りんご', 'ringo', 'an apple', 'apel');
const hon = obj('本', 'hon', 'a book', 'buku');
const shinbun = obj('新聞', 'shinbun', 'the newspaper', 'koran');
const zasshi = obj('ざっし', 'zasshi', 'a magazine', 'majalah');
const tegami = obj('てがみ', 'tegami', 'a letter', 'surat');
const namae = obj('名前', 'namae', 'my name', 'nama');
const kanjiObj = obj('かんじ', 'kanji', 'kanji', 'kanji');
const hiraganaObj = obj('ひらがな', 'hiragana', 'hiragana', 'hiragana');
const katakanaObj = obj('カタカナ', 'katakana', 'katakana', 'katakana');
const terebi = obj('テレビ', 'terebi', 'TV', 'TV');
const eiga = obj('えいが', 'eiga', 'a movie', 'film');
const ongaku = obj('おんがく', 'ongaku', 'music', 'musik');
const kaban = obj('かばん', 'kaban', 'a bag', 'tas');
const tokei = obj('とけい', 'tokei', 'a watch', 'jam');
const okane = obj('おかね', 'okane', 'money', 'uang');
const hana = obj('はな', 'hana', 'a flower', 'bunga');
const kuruma = obj('車', 'kuruma', 'a car', 'mobil');
const ki = obj('木', 'ki', 'a tree', 'pohon');

// Time words with the tense they require
const time = (jp, ro, en, id, tense) => ({ jp, ro, en, id, tense });
const noTime = time('', '', '', '', 'present');
const mainichi = time('毎日', 'mainichi', 'every day', 'Setiap hari', 'present');
const kyou = time('今日', 'kyou', 'today', 'Hari ini', 'present');
const kinou = time('きのう', 'kinou', 'yesterday', 'Kemarin', 'past');
const konshuu = time('今週', 'konshuu', 'this week', 'Minggu ini', 'present');
const senshuu = time('先週', 'senshuu', 'last week', 'Minggu lalu', 'past');
const raishuu = time('来週', 'raishuu', 'next week', 'Minggu depan', 'future');
const ashita = time('あした', 'ashita', 'tomorrow', 'Besok', 'future');

// Adjectives: plain, plus alternatives used when the noun makes them mean
// something else (高い on a mountain is "high", not "expensive")
const adj = (jp, ro, en, id, enAlt, idAlt) => ({ jp, ro, en, id, enAlt, idAlt });
const atarashii = adj('新しい', 'atarashii', 'new', 'baru');
const furui = adj('古い', 'furui', 'old', 'lama');
const takai = adj('高い', 'takai', 'expensive', 'mahal', 'high', 'tinggi');
const yasui = adj('安い', 'yasui', 'cheap', 'murah');
const ookii = adj('大きい', 'ookii', 'big', 'besar');
const chiisai = adj('小さい', 'chiisai', 'small', 'kecil');
const nagai = adj('長い', 'nagai', 'long', 'panjang');
const shiroi = adj('白い', 'shiroi', 'white', 'putih');
const kuroi = adj('黒い', 'kuroi', 'black', 'hitam');
const aoi = adj('青い', 'aoi', 'blue', 'biru');

// Numbers / hours / days
const hours = [
  ['一', 'ichi', 'one', 'satu'], ['二', 'ni', 'two', 'dua'], ['三', 'san', 'three', 'tiga'],
  ['四', 'yo', 'four', 'empat'], ['五', 'go', 'five', 'lima'], ['六', 'roku', 'six', 'enam'],
  ['七', 'shichi', 'seven', 'tujuh'], ['八', 'hachi', 'eight', 'delapan'],
  ['九', 'ku', 'nine', 'sembilan'], ['十', 'juu', 'ten', 'sepuluh'],
].map(([jp, ro, en, id]) => ({ jp: `${jp}時`, ro: `${ro}ji`, en: `${en} o'clock`, id: `jam ${id}` }));

const days = [
  ['月', 'getsu', 'Monday', 'Senin'], ['火', 'ka', 'Tuesday', 'Selasa'], ['水', 'sui', 'Wednesday', 'Rabu'],
  ['木', 'moku', 'Thursday', 'Kamis'], ['土', 'do', 'Saturday', 'Sabtu'],
  ['日', 'nichi', 'Sunday', 'Minggu'],
].map(([jp, ro, en, id]) => ({ jp: `${jp}曜日`, ro: `${ro}youbi`, en, id }));

// ---------- Sentence templates ----------
// Each template returns { jp, ro, en, id }. Romanji is word-spaced; spaces
// (and the wo/o particle variants) are handled by the game when checking.
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const subjEn = (p, v) => (p.third ? v.en3 : v.en);
const subjEnTense = (p, v, tense) =>
  tense === 'past' ? v.enPast : tense === 'future' ? v.enFut : subjEn(p, v);
const trailing = (text) => (text ? ` ${text}` : '');

// Marks a particle so the game can show it in a different color
const P = (text) => ({ text, particle: true });
// Joins sentence parts while keeping track of each particle's character index
const seg = (...parts) => {
  let jp = '';
  const particles = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      jp += part;
      continue;
    }
    for (let i = 0; i < part.text.length; i++) particles.push(jp.length + i);
    jp += part.text;
  }
  return { jp, particles };
};

// ---------- Furigana ----------
// Small kana readings shown above each kanji when the player asks for help in
// the sentences practice mode. Keys are the maximal runs of consecutive kanji
// exactly as they appear in the assembled sentences; values are the kana
// readings of that run, one entry per kanji character (okurigana and
// particles stay unannotated). The same dictionary is used to verify the
// hand-written "furigana" fields of the curated sentences in src/sentences.js.
const furiganaByKanjiRun = {
  // verbs
  '飲': ['の'], '食': ['た'], '読': ['よ'], '書': ['か'], '見': ['み'], '買': ['か'],
  '聞': ['き'], '話': ['はな'], '会': ['あ'], '行': ['い'], '来': ['き'], '帰': ['かえ'],
  '休': ['やす'],
  // people
  '学生': ['がく', 'せい'], '先生': ['せん', 'せい'], '友': ['とも'],
  '父': ['ちち'], '母': ['はは'], '男': ['おとこ'], '女': ['おんな'], '子': ['こ'],
  // places & things
  '学校': ['がっ', 'こう'], '駅': ['えき'], '店': ['みせ'], '山': ['やま'], '川': ['かわ'],
  '日本': ['に', 'ほん'], '日本語': ['に', 'ほん', 'ご'], '日本人': ['に', 'ほん', 'じん'],
  '外国': ['がい', 'こく'], '大学': ['だい', 'がく'], '新聞': ['しん', 'ぶん'], '名前': ['な', 'まえ'],
  '電車': ['でん', 'しゃ'], '車': ['くるま'], '水': ['みず'], '本': ['ほん'], '木': ['き'],
  '手': ['て'], '天気': ['てん', 'き'], '雨': ['あめ'], '国': ['くに'], '北': ['きた'],
  // positions ("on the desk", "inside the bag", ...)
  '上': ['うえ'], '中': ['なか'], '下': ['した'],
  // time words
  '毎日': ['まい', 'にち'], '毎週': ['まい', 'しゅう'], '今日': ['きょ', 'う'],
  '今週': ['こん', 'しゅう'], '先週': ['せん', 'しゅう'], '来週': ['らい', 'しゅう'], '今': ['いま'],
  // adjectives (the trailing い stays unannotated)
  '新': ['あたら'], '古': ['ふる'], '高': ['たか'], '安': ['やす'], '大': ['おお'],
  '小': ['ちい'], '長': ['なが'], '白': ['しろ'], '黒': ['くろ'], '青': ['あお'],
  '多': ['おお'], '少': ['すく'],
  // hours (X時) and "half past"
  '一時': ['いち', 'じ'], '二時': ['に', 'じ'], '三時': ['さん', 'じ'], '四時': ['よ', 'じ'],
  '五時': ['ご', 'じ'], '六時': ['ろく', 'じ'], '七時': ['しち', 'じ'], '八時': ['はち', 'じ'],
  '九時': ['く', 'じ'], '十時': ['じゅう', 'じ'], '半': ['はん'],
  // days of the week
  '月曜日': ['げつ', 'よう', 'び'], '火曜日': ['か', 'よう', 'び'], '水曜日': ['すい', 'よう', 'び'],
  '木曜日': ['もく', 'よう', 'び'], '土曜日': ['ど', 'よう', 'び'], '日曜日': ['にち', 'よう', 'び'],
  // prices (X円) and people counters (X人)
  '百円': ['ひゃく', 'えん'], '二百円': ['に', 'ひゃく', 'えん'], '三百円': ['さん', 'びゃく', 'えん'],
  '五百円': ['ご', 'ひゃく', 'えん'], '千円': ['せん', 'えん'],
  '一人': ['ひと', 'り'], '二人': ['ふた', 'り'], '三人': ['さん', 'にん'], '四人': ['よ', 'にん'],
  '五人': ['ご', 'にん'], '六人': ['ろく', 'にん'], '七人': ['しち', 'にん'], '八人': ['はち', 'にん'],
  '九人': ['きゅう', 'にん'], '十人': ['じゅう', 'にん'], '三百人': ['さん', 'びゃく', 'にん'],
  '人': ['ひと'],
};

const isKanji = (character) => /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(character);
const KANA_READING = /^[\u3040-\u30ff]+$/;

// Dictionary keys ordered longest first, so the greedy matcher below prefers
// e.g. 今日 over 今 + a lookup failure on 日 when words abut each other.
const furiganaRuns = Object.keys(furiganaByKanjiRun)
  .sort((a, b) => [...b].length - [...a].length);

// Builds the { characterIndex: reading } map of a sentence by matching every
// kanji word against the dictionary above (longest match wins, so abutting
// words like 毎日 + 五時 segment correctly). Returns {} for kana-only
// sentences and null when a kanji word is missing from the dictionary.
function computeFurigana(jp) {
  const characters = [...jp];
  const furigana = {};
  let i = 0;
  while (i < characters.length) {
    if (!isKanji(characters[i])) { i++; continue; }
    const run = furiganaRuns.find(key =>
      [...key].every((character, offset) => characters[i + offset] === character)
    );
    if (!run) return null;
    const readings = furiganaByKanjiRun[run];
    [...run].forEach((_, offset) => { furigana[i + offset] = readings[offset]; });
    i += [...run].length;
  }
  return furigana;
}

const templates = [];

// 1. この / その / あの + noun + は + adjective + です (e.g. この本は新しいです)
{
  const demos = [
    { jp: 'この', ro: 'kono', en: 'This', id: 'ini' },
    { jp: 'その', ro: 'sono', en: 'That', id: 'itu' },
    { jp: 'あの', ro: 'ano', en: 'That', id: 'itu' },
  ];
  const nouns = [
    { item: hon, adjs: [atarashii, furui, takai, yasui] },
    { item: kuruma, adjs: [atarashii, furui, takai, yasui, ookii, chiisai, shiroi, kuroi, aoi] },
    { item: obj('店', 'mise', 'shop', 'toko'), adjs: [atarashii, furui, ookii, chiisai, yasui] },
    { item: mountain, adjs: [takai, ookii] },
    { item: river, adjs: [nagai, ookii, chiisai] },
    { item: school, adjs: [atarashii, furui, ookii, chiisai] },
    { item: station, adjs: [atarashii, furui, ookii, chiisai] },
    { item: kaban, adjs: [atarashii, furui, ookii, chiisai, takai, yasui] },
    { item: terebi, adjs: [atarashii, furui, ookii, chiisai, takai, yasui] },
  ];
  const out = [];
  for (const demo of demos) {
    for (const { item, adjs } of nouns) {
      for (const a of adjs) {
        const useAlt = item === mountain && a === takai;
        const { jp, particles } = seg(demo.jp, item.jp, P('は'), a.jp, 'です');
        out.push({
          jp,
          particles,
          ro: `${demo.ro} ${item.ro} wa ${a.ro} desu`,
          en: `${demo.en} ${(item.en ?? item.enNoun).replace(/^(a|an|the) /, '')} is ${useAlt ? a.enAlt : a.en}`,
          id: `${cap(item.id ?? item.idNoun)} ${demo.id} ${useAlt ? a.idAlt : a.id}`,
        });
      }
    }
  }
  for (const entry of out) {
    // "That book over there is new" reads better for あの
    if (entry.jp.startsWith('あの')) {
      entry.en = entry.en.replace(' is ', ' over there is ');
    }
  }
  templates.push(['この/その/あの + noun + は + adjective', out]);
}

// 2. Weather (e.g. きのうは雨でした)
templates.push(['weather', [
  { jp: '今日は天気がいいです', particles: [2, 5], ro: 'kyou wa tenki ga ii desu', en: 'The weather is good today', id: 'Cuaca hari ini bagus' },
  { jp: 'あしたは雨です', particles: [3], ro: 'ashita wa ame desu', en: 'It will rain tomorrow', id: 'Besok hujan' },
  { jp: 'きのうは雨でした', particles: [3], ro: 'kinou wa ame deshita', en: 'It rained yesterday', id: 'Kemarin hujan' },
  { jp: 'きのうは天気がよかったです', particles: [3, 6], ro: 'kinou wa tenki ga yokatta desu', en: 'The weather was good yesterday', id: 'Kemarin cuacanya bagus' },
]]);

// 3. [person] は [time] [place] へ 行きます / に 来ます / に 帰ります
{
  const out = [];
  const goPlaces = [school, station, shop, departmentStore, supermarket, park, mountain, river, japan, foreignCountry];
  const goTimes = [noTime, ashita, kinou, mainichi];
  for (const p of [watashi, anata, gakusei, sensei, tomodachi, chichi, haha]) {
    for (const pl of goPlaces) {
      for (const t of goTimes) {
        const past = t.tense === 'past';
        const { jp, particles } = seg(p.jp, P('は'), t.jp, pl.jp, P('へ'), past ? '行きました' : '行きます');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${t.ro ? t.ro + ' ' : ''}${pl.ro} e ${past ? 'ikimashita' : 'ikimasu'}`,
          en: `${cap(p.en)} ${subjEnTense(p, go, t.tense)} ${pl.enTo}${trailing(t.en.toLowerCase())}`,
          id: `${t.id ? t.id + ' ' : ''}${p.id} pergi ${pl.idTo}`,
        });
      }
    }
  }
  for (const p of [watashi, anata, gakusei, sensei, tomodachi, chichi, haha]) {
    for (const pl of [school, station, shop, japan, park, foreignCountry]) {
      for (const t of [noTime, ashita, kinou]) {
        const past = t.tense === 'past';
        const { jp, particles } = seg(p.jp, P('は'), t.jp, pl.jp, P('に'), past ? '来ました' : '来ます');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${t.ro ? t.ro + ' ' : ''}${pl.ro} ni ${past ? 'kimashita' : 'kimasu'}`,
          en: `${cap(p.en)} ${subjEnTense(p, come, t.tense)} ${pl.enTo}${trailing(t.en.toLowerCase())}`,
          id: `${t.id ? t.id + ' ' : ''}${p.id} datang ${pl.idTo}`,
        });
      }
    }
    for (const pl of [home, japan]) {
      for (const t of [noTime, kinou]) {
        const past = t.tense === 'past';
        const { jp, particles } = seg(p.jp, P('は'), t.jp, pl.jp, P('に'), past ? '帰りました' : '帰ります');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${t.ro ? t.ro + ' ' : ''}${pl.ro} ni ${past ? 'kaerimashita' : 'kaerimasu'}`,
          en: `${cap(p.en)} ${subjEnTense(p, returnHome, t.tense)}${pl === japan ? ' to Japan' : ''}${trailing(t.en.toLowerCase())}`,
          id: `${t.id ? t.id + ' ' : ''}${p.id} pulang${pl === japan ? ' ke Jepang' : ' ke rumah'}`,
        });
      }
    }
  }
  templates.push(['[person] は [place] へ 行きます / に 来ます', out]);
}

// 4. [time] [person] は [object] を [verb] (e.g. きのう、学生は本を読みました)
{
  const pairs = [
    [mizu, drink], [ocha, drink], [coffee, drink], [milk, drink],
    [gohan, eat], [asagohan, eat], [pan, eat], [fish, eat], [meat, eat], [egg, eat], [ramen, eat], [sushi, eat], [apple, eat],
    [hon, readV], [shinbun, readV], [zasshi, readV],
    [tegami, writeV], [namae, writeV], [kanjiObj, writeV], [hiraganaObj, writeV], [katakanaObj, writeV],
    [terebi, watchV], [eiga, watchV],
    [kaban, buy], [tokei, buy], [hana, buy],
    [ongaku, listen],
  ];
  const out = [];
  for (const p of [watashi, anata, gakusei, sensei, tomodachi, chichi, haha, otokonoko, onnanoko]) {
    for (const [item, v] of pairs) {
      for (const t of [noTime, mainichi, kyou, kinou, konshuu, senshuu, raishuu]) {
        const past = t.tense === 'past';
        const { jp, particles } = seg(t.jp ? t.jp + '、' : '', p.jp, P('は'), item.jp, P('を'), past ? v.jpPast : v.jp);
        out.push({
          jp,
          particles,
          ro: `${t.ro ? t.ro + ' ' : ''}${p.ro} wa ${item.ro} wo ${past ? v.roPast : v.ro}`,
          en: `${cap(p.en)} ${subjEnTense(p, v, t.tense)} ${item.en}${trailing(t.en.toLowerCase())}`,
          id: `${t.id ? t.id + ' ' : ''}${p.id} ${v.id} ${item.id}`,
        });
      }
    }
  }
  templates.push(['[person] は [object] を [verb]', out]);
}

// 5. [person] は [place] で [object] を [verb] (e.g. 父は店で水を買います)
{
  const combos = [
    [shop, [mizu, hon, kaban, tokei, hana, pan, terebi, kuruma], buy],
    [departmentStore, [mizu, hon, kaban, tokei, hana, pan, terebi], buy],
    [supermarket, [mizu, pan, fish, meat, egg, apple], buy],
    [home, [gohan, pan, ramen, sushi, apple], eat],
    [shop, [gohan, pan, ramen], eat],
    [restaurant, [gohan, ramen, sushi], eat],
    [home, [mizu, ocha, coffee, milk], drink],
    [restaurant, [ocha, coffee, milk], drink],
    [home, [terebi, eiga], watchV],
    [school, [hon, shinbun, zasshi], readV],
    [home, [hon, shinbun, zasshi], readV],
    [home, [ongaku], listen],
  ];
  const out = [];
  for (const p of [watashi, anata, gakusei, sensei, tomodachi, chichi, haha]) {
    for (const [pl, items, v] of combos) {
      for (const item of items) {
        for (const t of [noTime, mainichi, kinou, raishuu]) {
          const past = t.tense === 'past';
          const { jp, particles } = seg(t.jp ? t.jp + '、' : '', p.jp, P('は'), pl.jp, P('で'), item.jp, P('を'), past ? v.jpPast : v.jp);
          out.push({
            jp,
            particles,
            ro: `${t.ro ? t.ro + ' ' : ''}${p.ro} wa ${pl.ro} de ${item.ro} wo ${past ? v.roPast : v.ro}`,
            en: `${cap(p.en)} ${subjEnTense(p, v, t.tense)} ${item.en} ${pl.enAt}${trailing(t.en.toLowerCase())}`,
            id: `${t.id ? t.id + ' ' : ''}${p.id} ${v.id} ${item.id} di ${pl.idAt.replace('di ', '')}`,
          });
        }
      }
    }
  }
  templates.push(['[person] は [place] で [object] を [verb]', out]);
}

// 6a. [place] に [thing] が あります (e.g. 店にパンがあります)
{
  const combos = [
    [shop, [pan, mizu, hon, obj('テレビ', 'terebi', 'a TV', 'TV'), hana]],
    [departmentStore, [pan, mizu, hon, obj('テレビ', 'terebi', 'a TV', 'TV'), hana]],
    [supermarket, [pan, mizu, fish, meat, egg, apple]],
    [japan, [obj('山', 'yama', 'a mountain', 'gunung'), obj('川', 'kawa', 'a river', 'sungai')]],
    [park, [hana, ki]],
  ];
  const out = [];
  for (const [pl, items] of combos) {
    for (const item of items) {
      const { jp, particles } = seg(pl.jp, P('に'), item.jp, P('が'), 'あります');
      out.push({
        jp,
        particles,
        ro: `${pl.ro} ni ${item.ro} ga arimasu`,
        en: `There is ${item.en} ${pl.enAt}`,
        id: `Di ${pl.idAt.replace(/^di /, '').replace(/ ada$/, '')} ada ${item.id}`,
      });
    }
  }
  templates.push(['[place] に [thing] が あります', out]);
}

// 6b. [place] に [person] が います (e.g. 学校に学生がいます)
{
  const out = [];
  for (const pl of [school, station, shop, park, departmentStore]) {
    for (const p of [gakusei, sensei, tomodachi, otokonoko, onnanoko]) {
      const { jp, particles } = seg(pl.jp, P('に'), p.jp, P('が'), 'います');
      out.push({
        jp,
        particles,
        ro: `${pl.ro} ni ${p.ro} ga imasu`,
        en: `${cap(p.en)} is ${pl.enAt}`,
        id: `${cap(p.id)} ada di ${pl.idAt.replace('di ', '')}`,
      });
    }
  }
  templates.push(['[place] に [person] が います', out]);
}

// 7. [thing] は [location] に あります (e.g. 本はつくえの上にあります)
{
  const desk = 'つくえ';
  const chair = 'いす';
  const combos = [
    [`${desk}の上`, 'tsukue no ue', 'on the desk', 'di atas meja', [hon, kaban, tokei, okane]],
    [`かばんの中`, 'kaban no naka', 'inside the bag', 'di dalam tas', [hon, tokei, okane]],
    [`${chair}の下`, 'isu no shita', 'under the chair', 'di bawah kursi', [kaban]],
    ['へやの中', 'heya no naka', 'in the room', 'di dalam kamar', [terebi, obj(desk, 'tsukue', 'the desk', 'meja'), obj(chair, 'isu', 'the chair', 'kursi')]],
  ];
  const out = [];
  for (const [jpLoc, roLoc, enLoc, idLoc, items] of combos) {
    for (const item of items) {
      const [locBefore, locAfter] = jpLoc.split('の');
      const { jp, particles } = seg(item.jp, P('は'), locBefore, P('の'), locAfter, P('に'), 'あります');
      out.push({
        jp,
        particles,
        ro: `${item.ro} wa ${roLoc} ni arimasu`,
        en: `The ${item.en.replace(/^(a|an|the) /, '')} is ${enLoc}`,
        id: `${cap(item.id)} ada ${idLoc}`,
      });
    }
  }
  templates.push(['[thing] は [location] に あります', out]);
}

// 8. [person] は [thing] が すきです (e.g. 学生はコーヒーがすきです)
{
  const out = [];
  // "likes apples" reads better than "likes an apple"
  const likeItem = (en) => {
    if (!/^an? /.test(en)) return en;
    const bare = en.replace(/^an? /, '');
    return bare.endsWith('y') ? `${bare.slice(0, -1)}ies` : `${bare}${/(s|ch|sh|x)$/.test(bare) ? 'es' : 's'}`;
  };
  for (const p of [watashi, gakusei, sensei, tomodachi, chichi, haha]) {
    for (const item of [coffee, ocha, sushi, apple, ongaku, eiga, obj('日本', 'nihon', 'Japan', 'Jepang')]) {
      const { jp, particles } = seg(p.jp, P('は'), item.jp, P('が'), 'すきです');
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ${item.ro} ga suki desu`,
        en: `${cap(p.en)} ${p.third ? 'likes' : 'like'} ${likeItem(item.en)}`,
        id: `${p.id} suka ${item.id}`,
      });
    }
  }
  templates.push(['[person] は [thing] が すきです', out]);
}

// 9. [place] は どこですか (e.g. 駅はどこですか)
{
  const out = [];
  for (const pl of [school, station, shop, park, departmentStore, supermarket]) {
    const { jp, particles } = seg(pl.jp, P('は'), 'どこです', P('か'));
    out.push({
      jp,
      particles,
      ro: `${pl.ro} wa doko desu ka`,
      en: `Where is ${pl.enNoun}?`,
      id: `${cap(pl.idNoun)} di mana?`,
    });
  }
  templates.push(['[place] は どこですか', out]);
}

// 10. [person] は [language] を 話します / 読みます / 書きます
{
  const languages = [
    obj('日本語', 'nihongo', 'Japanese', 'bahasa Jepang'),
    obj('えいご', 'eigo', 'English', 'bahasa Inggris'),
    obj('ちゅうごくご', 'chuugokugo', 'Chinese', 'bahasa Mandarin'),
  ];
  const out = [];
  for (const p of [watashi, gakusei, sensei, tomodachi, anata]) {
    for (const lang of languages) {
      for (const v of [speak, readV, writeV]) {
        const { jp, particles } = seg(p.jp, P('は'), lang.jp, P('を'), v.jp);
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${lang.ro} wo ${v.ro}`,
          en: `${cap(p.en)} ${subjEn(p, v)} ${lang.en}`,
          id: `${p.id} ${v.id} ${lang.id}`,
        });
      }
    }
  }
  templates.push(['[person] は [language] を [verb]', out]);
}

// 11. [person] は [place] に います (e.g. 父は今店にいます)
{
  const out = [];
  for (const p of [gakusei, sensei, tomodachi, chichi, haha]) {
    for (const pl of [school, station, shop, home, park]) {
      for (const withNow of [false, true]) {
        const { jp, particles } = seg(p.jp, P('は'), withNow ? '今' : '', pl.jp, P('に'), 'います');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${withNow ? 'ima ' : ''}${pl.ro} ni imasu`,
          en: `${cap(p.en)} is ${pl.enAt}${withNow ? ' now' : ''}`,
          id: `${p.id} ada di ${pl.idAt.replace('di ', '')}${withNow ? ' sekarang' : ''}`,
        });
      }
    }
  }
  templates.push(['[person] は [place] に います', out]);
}

// 12. [person] は [place] で 友だちに 会います (e.g. 学生は駅で友だちに会います)
{
  const out = [];
  for (const p of [watashi, gakusei, sensei]) {
    for (const pl of [station, school, shop, park, departmentStore]) {
      for (const t of [noTime, kyou, kinou]) {
        const past = t.tense === 'past';
        const { jp, particles } = seg(t.jp ? t.jp + '、' : '', p.jp, P('は'), pl.jp, P('で'), '友だち', P('に'), past ? '会いました' : '会います');
        out.push({
          jp,
          particles,
          ro: `${t.ro ? t.ro + ' ' : ''}${p.ro} wa ${pl.ro} de tomodachi ni ${past ? 'aimashita' : 'aimasu'}`,
          en: `${cap(p.en)} ${past ? 'met' : 'meets'} a friend ${pl.enAt}${trailing(t.en.toLowerCase())}`,
          id: `${t.id ? t.id + ' ' : ''}${p.id} bertemu teman di ${pl.idAt.replace('di ', '')}`,
        });
      }
    }
  }
  templates.push(['[person] は [place] で 友だちに 会います', out]);
}

// 13. [person] は [place] で (subject を) べんきょうします (e.g. 学生は学校で日本語をべんきょうします)
{
  const out = [];
  for (const p of [watashi, gakusei, tomodachi, sensei]) {
    for (const pl of [school, home, room]) {
      for (const t of [noTime, mainichi, kinou]) {
        const past = t.tense === 'past';
        const { jp, particles } = seg(t.jp ? t.jp + '、' : '', p.jp, P('は'), pl.jp, P('で'), past ? 'べんきょうしました' : 'べんきょうします');
        out.push({
          jp,
          particles,
          ro: `${t.ro ? t.ro + ' ' : ''}${p.ro} wa ${pl.ro} de ${past ? 'benkyou shimashita' : 'benkyou shimasu'}`,
          en: `${cap(p.en)} ${past ? 'studied' : 'studies'} ${pl.enAt}${trailing(t.en.toLowerCase())}`,
          id: `${t.id ? t.id + ' ' : ''}${p.id} belajar di ${pl.idAt.replace('di ', '')}`,
        });
      }
    }
    for (const [item, v] of [[obj('日本語', 'nihongo', 'Japanese', 'bahasa Jepang'), 'Japanese'], [kanjiObj, 'kanji'], [hiraganaObj, 'hiragana'], [katakanaObj, 'katakana'], [obj('えいご', 'eigo', 'English', 'bahasa Inggris'), 'English']]) {
      const { jp, particles } = seg(p.jp, P('は'), '学校', P('で'), item.jp, P('を'), 'べんきょうします');
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa gakkou de ${item.ro} wo benkyou shimasu`,
        en: `${cap(p.en)} studies ${v} at school`,
        id: `${p.id} belajar ${item.id} di sekolah`,
      });
    }
  }
  templates.push(['[person] は [place] で べんきょうします', out]);
}

// 14. [person] の [thing] は [adjective] です (e.g. 父の車は新しいです)
{
  const things = [
    [kuruma, [atarashii, furui, ookii, chiisai, shiroi, kuroi, takai]],
    [hon, [atarashii, furui]],
    [kaban, [atarashii, furui, ookii, chiisai]],
    [tokei, [atarashii, furui, takai]],
    [terebi, [atarashii, furui, ookii, chiisai]],
  ];
  const out = [];
  for (const p of [watashi, anata, chichi, haha, tomodachi]) {
    for (const [item, adjs] of things) {
      for (const a of adjs) {
        const { jp, particles } = seg(p.jp, P('の'), item.jp, P('は'), a.jp, 'です');
        out.push({
          jp,
          particles,
          ro: `${p.ro} no ${item.ro} wa ${a.ro} desu`,
          en: `${cap(p.enPoss)} ${item.en.replace(/^(a|an|the) /, '')} is ${a.en}`,
          id: `${cap(item.id)} ${p.idPoss} ${a.id}`,
        });
      }
    }
  }
  templates.push(['[person] の [thing] は [adjective] です', out]);
}

// 15. Days (e.g. あしたは水曜日です / きのうは日曜日でした)
{
  const out = [];
  for (const day of days) {
    const today = seg('今日', P('は'), day.jp, 'です');
    out.push({
      jp: today.jp,
      particles: today.particles,
      ro: `kyou wa ${day.ro} desu`,
      en: `Today is ${day.en}`,
      id: `Hari ini hari ${day.id}`,
    });
    const tomorrow = seg('あした', P('は'), day.jp, 'です');
    out.push({
      jp: tomorrow.jp,
      particles: tomorrow.particles,
      ro: `ashita wa ${day.ro} desu`,
      en: `Tomorrow is ${day.en}`,
      id: `Besok hari ${day.id}`,
    });
    const yesterday = seg('きのう', P('は'), day.jp, 'でした');
    out.push({
      jp: yesterday.jp,
      particles: yesterday.particles,
      ro: `kinou wa ${day.ro} deshita`,
      en: `Yesterday was ${day.en}`,
      id: `Kemarin hari ${day.id}`,
    });
  }
  templates.push(['days of the week', out]);
}

// 16. [person] は 毎日 [hour] に 学校へ 行きます (e.g. 学生は毎日六時に学校へ行きます)
{
  const out = [];
  for (const p of [watashi, gakusei, tomodachi]) {
    for (const hour of hours) {
      const { jp, particles } = seg(p.jp, P('は'), '毎日', hour.jp, P('に'), '学校', P('へ'), '行きます');
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa mainichi ${hour.ro} ni gakkou e ikimasu`,
        en: `${cap(p.en)} ${p.third ? 'goes' : 'go'} to school at ${hour.en} every day`,
        id: `Setiap hari ${p.id.toLowerCase()} pergi ke sekolah ${hour.id}`,
      });
    }
  }
  templates.push(['[person] は 毎日 [hour] に 学校へ 行きます', out]);
}

// 17. [person] は [place] で 休みます (e.g. 母はうちで休みます)
{
  const out = [];
  for (const p of [watashi, chichi, haha, gakusei]) {
    for (const pl of [home, park, room]) {
      const { jp, particles } = seg(p.jp, P('は'), pl.jp, P('で'), '休みます');
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ${pl.ro} de yasumimasu`,
        en: `${cap(p.en)} ${p.third ? 'rests' : 'rest'} ${pl.enAt}`,
        id: `${p.id} beristirahat di ${pl.idAt.replace('di ', '')}`,
      });
    }
  }
  templates.push(['[person] は [place] で 休みます', out]);
}

// ---------- Daily-life templates ----------
// Word banks below are drawn from the app's own data files, so the new
// sentences practice exactly the vocabulary the app teaches:
// - kanaCharacters.js "words" (verbs like ねる/おきる/あらう, food, places,
//   family, transport, time words, expressions)
// - kanjiUsage.js + kanjiUsageMeanings.js (compounds like 電車, 買い物, 上手
//   with their English/Indonesian meanings)
// - kanjiReadings.js (kun'yomi behind 多い/少ない)
// Kanji that are not taught yet (起, 寝, 朝, 病...) are written in kana, the
// same mix the words list itself uses (でんしゃ, ねる, おきる).

// Daily-life verbs from the words list (kana forms, except taught 買)
const okiru = verb('おきます', 'okimasu', 'おきました', 'okimashita', 'wake up', 'wakes up', 'will wake up', 'woke up', 'bangun');
const neru = verb('ねます', 'nemasu', 'ねました', 'nemashita', 'sleep', 'sleeps', 'will sleep', 'slept', 'tidur');
const arau = verb('あらいます', 'araimasu', 'あらいました', 'araimashita', 'wash', 'washes', 'will wash', 'washed', 'mencuci');
const tsukuru = verb('つくります', 'tsukurimasu', 'つくりました', 'tsukurimashita', 'make', 'makes', 'will make', 'made', 'membuat');

// People from the words list
const kare = person('かれ', 'kare', 'he', 'Dia (laki-laki)', true, 'his', 'nya (laki-laki)');
const kanojo = person('かのじょ', 'kanojo', 'she', 'Dia (perempuan)', true, 'her', 'nya (perempuan)');

// Places from the words list / kanjiUsage.js
const ginkou = place('ぎんこう', 'ginkou', 'the bank', 'bank', 'to the bank', 'ke bank', 'at the bank', 'di bank');
const byouin = place('びょういん', 'byouin', 'the hospital', 'rumah sakit', 'to the hospital', 'ke rumah sakit', 'at the hospital', 'di rumah sakit');
const kuukou = place('くうこう', 'kuukou', 'the airport', 'bandara', 'to the airport', 'ke bandara', 'at the airport', 'di bandara');
const konbini = place('コンビニ', 'konbini', 'the convenience store', 'minimarket', 'to the convenience store', 'ke minimarket', 'at the convenience store', 'di minimarket');
const daigaku = place('大学', 'daigaku', 'the university', 'universitas', 'to the university', 'ke universitas', 'at the university', 'di universitas');

// Food and drink from the words list
const onigiri = obj('おにぎり', 'onigiri', 'onigiri', 'nasi kepal');
const misoshiru = obj('みそしる', 'misoshiru', 'miso soup', 'sup miso');
const udon = obj('うどん', 'udon', 'udon', 'mi udon');
const soba = obj('そば', 'soba', 'soba', 'mi soba');
const karee = obj('カレーライス', 'karee raisu', 'curry rice', 'nasi kari');
const sarada = obj('サラダ', 'sarada', 'salad', 'salad');
const takoyaki = obj('たこやき', 'takoyaki', 'takoyaki', 'takoyaki');
const tenpura = obj('てんぷら', 'tenpura', 'tempura', 'tempura');
const yakisoba = obj('やきそば', 'yakisoba', 'fried noodles', 'mi goreng');
const yakitori = obj('やきとり', 'yakitori', 'grilled chicken', 'sate ayam');
const okashi = obj('おかし', 'okashi', 'sweets', 'camilan');
const keeki = obj('ケーキ', 'keeki', 'cake', 'kue');
const juusu = obj('ジュース', 'juusu', 'juice', 'jus');
const ramune = obj('ラムネ', 'ramune', 'Ramune soda', 'Ramune');

// D1. Daily routine: [person] は [time] に おきます / ねます (e.g. わたしはまいあさ六時におきます)
{
  const out = [];
  const routines = [
    { jp: 'まいあさ', ro: 'maiasa', en: 'every morning', id: 'setiap pagi' },
    { jp: '毎日', ro: 'mainichi', en: 'every day', id: 'setiap hari' },
  ];
  const dayparts = [
    { jp: 'ごぜん', ro: 'gozen', en: 'a.m.', id: 'pagi' },
    { jp: 'ごご', ro: 'gogo', en: 'p.m.', id: 'malam' },
  ];
  for (const p of [watashi, anata, chichi, haha, tomodachi, kare, kanojo]) {
    for (const v of [okiru, neru]) {
      for (const r of routines) {
        for (const hour of hours) {
          const { jp, particles } = seg(p.jp, P('は'), r.jp, hour.jp, P('に'), v.jp);
          out.push({
            jp,
            particles,
            ro: `${p.ro} wa ${r.ro} ${hour.ro} ni ${v.ro}`,
            en: `${cap(p.en)} ${subjEn(p, v)} at ${hour.en} ${r.en}`,
            id: `${cap(r.id)} ${p.id.toLowerCase()} ${v.id} ${hour.id}`,
          });
        }
      }
      for (const d of dayparts) {
        for (const hour of hours) {
          const { jp, particles } = seg(p.jp, P('は'), d.jp, hour.jp, P('に'), v.jp);
          out.push({
            jp,
            particles,
            ro: `${p.ro} wa ${d.ro} ${hour.ro} ni ${v.ro}`,
            en: `${cap(p.en)} ${subjEn(p, v)} at ${hour.en.replace(" o'clock", '')} ${d.en}`,
            id: `${p.id} ${v.id} ${hour.id} ${d.id}`,
          });
        }
      }
    }
  }
  templates.push(['daily routine: [person] は [time] に おきます / ねます', out]);
}

// D2. Chores: [person] は [thing] を あらいます / つくります (e.g. かれはかおをあらいます)
{
  const bodyParts = [
    obj('手', 'te', 'hands', 'tangan'),
    obj('かお', 'kao', 'face', 'wajah'),
    obj('くち', 'kuchi', 'mouth', 'mulut'),
  ];
  const possessive = { watashi: 'my', anata: 'your', kare: 'his', kanojo: 'her' };
  const out = [];
  for (const p of [watashi, anata, kare, kanojo]) {
    for (const part of bodyParts) {
      const { jp, particles } = seg(p.jp, P('は'), part.jp, P('を'), arau.jp);
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ${part.ro} wo ${arau.ro}`,
        en: `${cap(p.en)} ${subjEn(p, arau)} ${possessive[p.ro]} ${part.en}`,
        id: `${p.id} ${arau.id} ${part.id}`,
      });
    }
  }
  for (const p of [watashi, anata, chichi, haha, kare, kanojo]) {
    for (const item of [gohan, pan, okashi, keeki, misoshiru]) {
      const { jp, particles } = seg(p.jp, P('は'), item.jp, P('を'), tsukuru.jp);
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ${item.ro} wo ${tsukuru.ro}`,
        en: `${cap(p.en)} ${subjEn(p, tsukuru)} ${item.en}`,
        id: `${p.id} ${tsukuru.id} ${item.id}`,
      });
    }
  }
  templates.push(['chores: [person] は [thing] を あらいます / つくります', out]);
}

// D3. Commute: [person] は [vehicle] で [place] へ 行きます (e.g. 学生は電車で大学へ行きます)
{
  const vehicles = [
    obj('電車', 'densha', 'by train', 'kereta'),
    obj('バス', 'basu', 'by bus', 'bus'),
    obj('じてんしゃ', 'jitensha', 'by bicycle', 'sepeda'),
    obj('車', 'kuruma', 'by car', 'mobil'),
    obj('タクシー', 'takushii', 'by taxi', 'taksi'),
    obj('ちかてつ', 'chikatetsu', 'by subway', 'kereta bawah tanah'),
    obj('ひこうき', 'hikouki', 'by plane', 'pesawat'),
    obj('ふね', 'fune', 'by ship', 'kapal'),
  ];
  const destinations = [school, station, shop, park, departmentStore, supermarket, home, ginkou, byouin, kuukou, konbini, daigaku];
  const out = [];
  for (const p of [watashi, anata, gakusei, sensei, tomodachi, chichi, haha, kare, kanojo]) {
    for (const vehicle of vehicles) {
      for (const pl of destinations) {
        const { jp, particles } = seg(p.jp, P('は'), vehicle.jp, P('で'), pl.jp, P('へ'), '行きます');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${vehicle.ro} de ${pl.ro} e ikimasu`,
          en: `${cap(p.en)} ${subjEn(p, go)} ${pl.enTo} ${vehicle.en}`,
          id: `${p.id} pergi ${pl.idTo} naik ${vehicle.id}`,
        });
      }
    }
  }
  templates.push(['commute: [person] は [vehicle] で [place] へ 行きます', out]);
}

// D4. Meals: [person] は [place] で [food] を 食べます / 飲みます (e.g. こうえんでおにぎりを食べます)
{
  const pairs = [
    [onigiri, eat], [misoshiru, eat], [udon, eat], [soba, eat], [karee, eat],
    [sarada, eat], [takoyaki, eat], [tenpura, eat], [yakisoba, eat], [yakitori, eat],
    [okashi, eat], [keeki, eat], [pan, eat],
    [juusu, drink], [ramune, drink],
  ];
  const mealPlaces = [home, park, shop, konbini, school, restaurant, supermarket];
  const out = [];
  for (const p of [watashi, anata, gakusei, sensei, tomodachi, chichi, haha, kare, kanojo]) {
    for (const pl of mealPlaces) {
      for (const [item, v] of pairs) {
        for (const t of [noTime, kyou]) {
          const { jp, particles } = seg(t.jp ? t.jp + '、' : '', p.jp, P('は'), pl.jp, P('で'), item.jp, P('を'), v.jp);
          out.push({
            jp,
            particles,
            ro: `${t.ro ? t.ro + ' ' : ''}${p.ro} wa ${pl.ro} de ${item.ro} wo ${v.ro}`,
            en: `${cap(p.en)} ${subjEn(p, v)} ${item.en} ${pl.enAt}${trailing(t.en.toLowerCase())}`,
            id: `${t.id ? t.id + ' ' : ''}${p.id} ${v.id} ${item.id} di ${pl.idAt.replace('di ', '')}`,
          });
        }
      }
    }
  }
  templates.push(['meals: [person] は [place] で [food] を 食べます / 飲みます', out]);
}

// D5. Ordering: [item] を おねがいします (e.g. みずをおねがいします)
{
  const out = [];
  for (const d of [{ jp: 'これ', ro: 'kore', en: 'This', id: 'ini' }, { jp: 'それ', ro: 'sore', en: 'That', id: 'itu' }]) {
    const { jp, particles } = seg(d.jp, P('を'), 'おねがいします');
    out.push({
      jp,
      particles,
      ro: `${d.ro} wo onegaishimasu`,
      en: `${d.en}, please`,
      id: `Saya minta ${d.id}`,
    });
  }
  for (const item of [mizu, ocha, coffee, juusu, pan, onigiri, ramen, sarada]) {
    const { jp, particles } = seg(item.jp, P('を'), 'おねがいします');
    out.push({
      jp,
      particles,
      ro: `${item.ro} wo onegaishimasu`,
      en: `${cap(item.en)}, please`,
      id: `Saya minta ${item.id}`,
    });
  }
  templates.push(['ordering: [item] を おねがいします', out]);
}

// D6. Schedule: [person] は [hour] から [hour] まで [place] で べんきょうします
{
  const spans = [[0, 2], [1, 3], [2, 4], [8, 4], [7, 5], [9, 7], [6, 3]];
  const out = [];
  for (const p of [watashi, anata, gakusei, tomodachi]) {
    for (const pl of [school, home, daigaku]) {
      for (const [from, to] of spans) {
        const { jp, particles } = seg(p.jp, P('は'), hours[from].jp, 'から', hours[to].jp, 'まで', pl.jp, P('で'), 'べんきょうします');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${hours[from].ro} kara ${hours[to].ro} made ${pl.ro} de benkyou shimasu`,
          en: `${cap(p.en)} ${subjEn(p, study)} ${pl.enAt} from ${hours[from].en} to ${hours[to].en}`,
          id: `${p.id} belajar di ${pl.idAt.replace('di ', '')} dari ${hours[from].id} sampai ${hours[to].id}`,
        });
      }
    }
  }
  templates.push(['schedule: [person] は [hour] から [hour] まで [place] で べんきょうします', out]);
}

// D7. Likes and dislikes: [person] は [thing] が すきです / きらいです
{
  const likeItems = [
    obj('あめ', 'ame', 'rain', 'hujan'), obj('ゆき', 'yuki', 'snow', 'salju'),
    obj('はれ', 'hare', 'sunny weather', 'cuaca cerah'), obj('くもり', 'kumori', 'cloudy weather', 'cuaca berawan'),
    obj('サッカー', 'sakkaa', 'soccer', 'sepak bola'), obj('やきゅう', 'yakyuu', 'baseball', 'bisbol'),
    obj('テニス', 'tenisu', 'tennis', 'tenis'), obj('すいえい', 'suiei', 'swimming', 'renang'),
    obj('スポーツ', 'supootsu', 'sports', 'olahraga'), obj('カラオケ', 'karaoke', 'karaoke', 'karaoke'),
    obj('アニメ', 'anime', 'anime', 'anime'), obj('まんが', 'manga', 'manga', 'manga'),
    okashi, keeki,
  ];
  const out = [];
  for (const p of [watashi, gakusei, sensei, tomodachi, chichi, haha, kare, kanojo]) {
    for (const item of likeItems) {
      for (const like of [true, false]) {
        const { jp, particles } = seg(p.jp, P('は'), item.jp, P('が'), like ? 'すきです' : 'きらいです');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${item.ro} ga ${like ? 'suki' : 'kirai'} desu`,
          en: `${cap(p.en)} ${p.third ? (like ? 'likes' : 'hates') : (like ? 'like' : 'hate')} ${item.en}`,
          id: `${p.id} ${like ? 'suka' : 'benci'} ${item.id}`,
        });
      }
    }
  }
  templates.push(['likes: [person] は [thing] が すきです / きらいです', out]);
}

// D8. Seasons and temperature (e.g. ふゆはさむいです)
templates.push(['seasons and temperature', [
  { jp: 'ふゆはさむいです', particles: [2], ro: 'fuyu wa samui desu', en: 'Winter is cold', id: 'Musim dingin itu dingin' },
  { jp: 'なつはあついです', particles: [2], ro: 'natsu wa atsui desu', en: 'Summer is hot', id: 'Musim panas itu panas' },
  { jp: 'あきはすずしいです', particles: [2], ro: 'aki wa suzushii desu', en: 'Autumn is cool', id: 'Musim gugur itu sejuk' },
  { jp: 'きょうはさむいです', particles: [3], ro: 'kyou wa samui desu', en: 'It is cold today', id: 'Hari ini dingin' },
  { jp: 'きょうはあついです', particles: [3], ro: 'kyou wa atsui desu', en: 'It is hot today', id: 'Hari ini panas' },
  { jp: 'きょうはすずしいです', particles: [3], ro: 'kyou wa suzushii desu', en: 'It is cool today', id: 'Hari ini sejuk' },
  { jp: 'きのうはさむかったです', particles: [3], ro: 'kinou wa samukatta desu', en: 'It was cold yesterday', id: 'Kemarin dingin' },
  { jp: 'きのうはあつかったです', particles: [3], ro: 'kinou wa atsukatta desu', en: 'It was hot yesterday', id: 'Kemarin panas' },
  { jp: 'まいあさはさむいです', particles: [4], ro: 'maiasa wa samui desu', en: 'Every morning is cold', id: 'Setiap pagi dingin' },
]]);

// D9. Family size: [member] が [number] 人 います (e.g. かぞくが四人います)
{
  const counters = [
    ['一人', 'hitori', 'one', 'satu'], ['二人', 'futari', 'two', 'dua'], ['三人', 'sannin', 'three', 'tiga'],
    ['四人', 'yonin', 'four', 'empat'], ['五人', 'gonin', 'five', 'lima'], ['六人', 'rokunin', 'six', 'enam'],
    ['七人', 'shichinin', 'seven', 'tujuh'], ['八人', 'hachinin', 'eight', 'delapan'],
    ['九人', 'kyuunin', 'nine', 'sembilan'], ['十人', 'juunin', 'ten', 'sepuluh'],
  ];
  const members = [
    { jp: 'かぞく', ro: 'kazoku', enWord: 'people in my family', enPlural: 'people in my family', idWord: 'orang di keluarga saya', there: true },
    { jp: 'こども', ro: 'kodomo', enWord: 'child', enPlural: 'children', idWord: 'anak', there: false },
    { jp: 'あに', ro: 'ani', enWord: 'older brother', enPlural: 'older brothers', idWord: 'kakak laki-laki', there: false },
    { jp: 'あね', ro: 'ane', enWord: 'older sister', enPlural: 'older sisters', idWord: 'kakak perempuan', there: false },
    { jp: 'おとうと', ro: 'otouto', enWord: 'younger brother', enPlural: 'younger brothers', idWord: 'adik laki-laki', there: false },
    { jp: 'いもうと', ro: 'imouto', enWord: 'younger sister', enPlural: 'younger sisters', idWord: 'adik perempuan', there: false },
  ];
  const out = [];
  for (const m of members) {
    for (const [jpN, roN, enN, idN] of counters) {
      const { jp, particles } = seg(m.jp, P('が'), jpN, 'います');
      out.push({
        jp,
        particles,
        ro: `${m.ro} ga ${roN} imasu`,
        en: m.there ? `There are ${enN} ${m.enPlural}` : enN === 'one' ? `I have one ${m.enWord}` : `I have ${enN} ${m.enPlural}`,
        id: m.there ? `Ada ${idN} ${m.idWord}` : `Saya punya ${idN} ${m.idWord}`,
      });
    }
  }
  templates.push(['family size: [member] が [number] 人 います', out]);
}

// D10. Prices: [item] は [price] 円 です (e.g. このりんごは百円です)
{
  const items = [
    obj('りんご', 'ringo', 'apple', 'apel'), pan, onigiri, juusu,
    obj('かさ', 'kasa', 'umbrella', 'payung'), obj('ノート', 'nooto', 'notebook', 'buku catatan'),
    obj('ペン', 'pen', 'pen', 'pulpen'), hon, keeki,
  ];
  const prices = [
    ['百円', 'hyaku en', '100 yen', 'seratus yen'], ['二百円', 'nihyaku en', '200 yen', 'dua ratus yen'],
    ['三百円', 'sanbyaku en', '300 yen', 'tiga ratus yen'], ['五百円', 'gohyaku en', '500 yen', 'lima ratus yen'],
    ['千円', 'sen en', '1,000 yen', 'seribu yen'],
  ];
  const demos = [
    { jp: 'この', ro: 'kono', en: 'This', id: 'ini' },
    { jp: 'その', ro: 'sono', en: 'That', id: 'itu' },
    { jp: 'あの', ro: 'ano', en: 'That', id: 'itu' },
  ];
  const out = [];
  for (const d of demos) {
    for (const item of items) {
      for (const [jpP, roP, enP, idP] of prices) {
        const { jp, particles } = seg(d.jp, item.jp, P('は'), jpP, 'です');
        out.push({
          jp,
          particles,
          ro: `${d.ro} ${item.ro} wa ${roP} desu`,
          en: `${d.en} ${item.en.replace(/^(a|an|the) /, '')} is ${enP}`,
          id: `${cap(item.id)} ${d.id} ${idP}`,
        });
      }
    }
  }
  for (const entry of out) {
    if (entry.jp.startsWith('あの')) {
      entry.en = entry.en.replace(' is ', ' over there is ');
    }
  }
  templates.push(['prices: [item] は [price] 円 です', out]);
}

// D11. Skills: [person] は [thing] が じょうずです (e.g. かのじょはりょうりがじょうずです)
{
  const skills = [
    obj('日本語', 'nihongo', 'Japanese', 'bahasa Jepang'), obj('えいご', 'eigo', 'English', 'bahasa Inggris'),
    obj('サッカー', 'sakkaa', 'soccer', 'sepak bola'), obj('やきゅう', 'yakyuu', 'baseball', 'bisbol'),
    obj('りょうり', 'ryouri', 'cooking', 'memasak'), obj('しゃしん', 'shashin', 'photography', 'foto'),
  ];
  const out = [];
  for (const p of [watashi, anata, gakusei, sensei, tomodachi, kare, kanojo]) {
    for (const s of skills) {
      const { jp, particles } = seg(p.jp, P('は'), s.jp, P('が'), 'じょうずです');
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ${s.ro} ga jouzu desu`,
        en: `${cap(p.en)} ${p.third ? 'is' : 'am'} good at ${s.en}`,
        id: `${p.id} pandai ${s.id}`,
      });
    }
  }
  templates.push(['skills: [person] は [thing] が じょうずです', out]);
}

// D12. Activities: [person] は [time] に [activity] を します (e.g. かれはしゅうまつにりょこうをします)
{
  const activities = [
    obj('スポーツ', 'supootsu', 'sports', 'olahraga'), obj('しゅくだい', 'shukudai', 'homework', 'PR'),
    obj('りょうり', 'ryouri', 'cooking', 'memasak'), obj('りょこう', 'ryokou', 'travel', 'wisata'),
    obj('しゃしん', 'shashin', 'photography', 'foto'), obj('かいもの', 'kaimono', 'shopping', 'belanja'),
    obj('べんきょう', 'benkyou', 'studying', 'belajar'),
  ];
  const actTimes = [
    { jp: 'しゅうまつ', ro: 'shuumatsu', en: 'on weekends', id: 'di akhir pekan' },
    { jp: 'まいにち', ro: 'mainichi', en: 'every day', id: 'setiap hari' },
    { jp: 'あした', ro: 'ashita', en: 'tomorrow', id: 'besok' },
    { jp: 'きょう', ro: 'kyou', en: 'today', id: 'hari ini' },
    { jp: 'ごご', ro: 'gogo', en: 'in the afternoon', id: 'sore' },
  ];
  const out = [];
  for (const p of [watashi, anata, gakusei, tomodachi, kare, kanojo, chichi, haha]) {
    for (const t of actTimes) {
      for (const a of activities) {
        const { jp, particles } = seg(p.jp, P('は'), t.jp, P('に'), a.jp, P('を'), 'します');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${t.ro} ni ${a.ro} wo shimasu`,
          en: `${cap(p.en)} ${p.third ? 'does' : 'do'} ${a.en} ${t.en}`,
          id: `${p.id} ${a.id} ${t.id}`,
        });
      }
    }
  }
  templates.push(['activities: [person] は [time] に [activity] を します', out]);
}

// D13. Together: [person] は [companion] と いっしょに [place] へ 行きます
{
  const companions = [
    { jp: 'ともだち', ro: 'tomodachi', en: 'a friend', id: 'teman' },
    { jp: 'はは', ro: 'haha', en: 'my mother', id: 'ibu' },
    { jp: 'ちち', ro: 'chichi', en: 'my father', id: 'ayah' },
  ];
  const out = [];
  for (const p of [watashi, anata, gakusei, kare, kanojo]) {
    for (const c of companions) {
      for (const pl of [school, station, park, shop, departmentStore, supermarket, konbini, kuukou]) {
        const { jp, particles } = seg(p.jp, P('は'), c.jp, P('と'), 'いっしょに', pl.jp, P('へ'), '行きます');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${c.ro} to issho ni ${pl.ro} e ikimasu`,
          en: `${cap(p.en)} ${subjEn(p, go)} ${pl.enTo} with ${c.en}`,
          id: `${p.id} pergi ${pl.idTo} bersama ${c.id}`,
        });
      }
    }
  }
  templates.push(['together: [person] は [companion] と いっしょに [place] へ 行きます', out]);
}

// D14. Crowded or quiet: [place] は 人 が 多い / 少ない です (e.g. 駅は人が多いです)
{
  const busyPlaces = [
    obj('駅', 'eki', 'the station', 'stasiun'), obj('店', 'mise', 'the shop', 'toko'),
    obj('スーパー', 'suupaa', 'the supermarket', 'supermarket'), obj('コンビニ', 'konbini', 'the convenience store', 'minimarket'),
    obj('こうえん', 'kouen', 'the park', 'taman'), obj('学校', 'gakkou', 'the school', 'sekolah'),
    obj('デパート', 'depaato', 'the department store', 'toko serba ada'),
  ];
  const out = [];
  for (const pl of busyPlaces) {
    for (const [adjJp, adjRo, adjEn, adjId] of [['多い', 'ooi', 'crowded', 'ramai'], ['少ない', 'sukunai', 'quiet', 'sepi']]) {
      const { jp, particles } = seg(pl.jp, P('は'), '人', P('が'), adjJp, 'です');
      out.push({
        jp,
        particles,
        ro: `${pl.ro} wa hito ga ${adjRo} desu`,
        en: `The ${pl.en.replace(/^(a|an|the) /, '')} is ${adjEn}`,
        id: `${cap(pl.id)} ${adjId}`,
      });
    }
  }
  templates.push(['crowded: [place] は 人 が 多い / 少ない です', out]);
}

// D15. Nearby landmarks: [place] の [side] に [thing] が あります (e.g. うちのまえにこうえんがあります)
{
  const kouenObj = obj('こうえん', 'kouen', 'a park', 'taman');
  const konbiniObj = obj('コンビニ', 'konbini', 'a convenience store', 'minimarket');
  const suupaaObj = obj('スーパー', 'suupaa', 'a supermarket', 'supermarket');
  const ginkouObj = obj('ぎんこう', 'ginkou', 'a bank', 'bank');
  const byouinObj = obj('びょういん', 'byouin', 'a hospital', 'rumah sakit');
  const ekiObj = obj('えき', 'eki', 'a station', 'stasiun');
  const jinjaObj = obj('じんじゃ', 'jinja', 'a shrine', 'kuil');
  const oteraObj = obj('おてら', 'otera', 'a temple', 'kuil');
  const basuteiObj = obj('バスてい', 'basutei', 'a bus stop', 'halte bus');
  const combos = [
    ['うちのまえ', 'uchi no mae', 'in front of the house', 'di depan rumah', [kouenObj, konbiniObj]],
    ['えきのまえ', 'eki no mae', 'in front of the station', 'di depan stasiun', [konbiniObj, suupaaObj]],
    ['みせのひだり', 'mise no hidari', 'to the left of the shop', 'di sebelah kiri toko', [ginkouObj, byouinObj]],
    ['みせのみぎ', 'mise no migi', 'to the right of the shop', 'di sebelah kanan toko', [suupaaObj]],
    ['がっこうのうしろ', 'gakkou no ushiro', 'behind the school', 'di belakang sekolah', [kouenObj]],
    ['こうえんのまえ', 'kouen no mae', 'in front of the park', 'di depan taman', [jinjaObj, oteraObj]],
    ['スーパーのまえ', 'suupaa no mae', 'in front of the supermarket', 'di depan supermarket', [basuteiObj]],
    ['うちのちかく', 'uchi no chikaku', 'near the house', 'dekat rumah', [ekiObj, konbiniObj]],
  ];
  const out = [];
  for (const [jpLoc, roLoc, enLoc, idLoc, items] of combos) {
    const [locBefore, locAfter] = jpLoc.split('の');
    for (const item of items) {
      const { jp, particles } = seg(locBefore, P('の'), locAfter, P('に'), item.jp, P('が'), 'あります');
      out.push({
        jp,
        particles,
        ro: `${roLoc} ni ${item.ro} ga arimasu`,
        en: `There is ${item.en} ${enLoc}`,
        id: `Ada ${item.id} ${idLoc}`,
      });
    }
  }
  templates.push(['nearby: [place] の [side] に [thing] が あります', out]);
}

// ---------- Question templates ----------
// The patterns above asked as questions (か at the end), so the "question"
// sentence pattern of the menu always has material to practice. The question
// words (だれ / なん / なんじ) are written in kana, and every sentence still
// only uses characters taught in kanaCharacters.js.

// Q1. [demo] [person] は だれですか (e.g. この人はだれですか)
{
  const demos = [
    { jp: 'この', ro: 'kono', en: 'this', id: 'ini' },
    { jp: 'その', ro: 'sono', en: 'that', id: 'itu' },
    { jp: 'あの', ro: 'ano', en: 'that', id: 'itu di sana', there: true },
  ];
  const people = [
    { jp: '人', ro: 'hito', en: 'person', id: 'orang' },
    { jp: '学生', ro: 'gakusei', en: 'student', id: 'pelajar' },
    { jp: '先生', ro: 'sensei', en: 'teacher', id: 'guru' },
    { jp: '男の子', ro: 'otokonoko', en: 'boy', id: 'anak laki-laki' },
    { jp: '女の子', ro: 'onnanoko', en: 'girl', id: 'anak perempuan' },
    { jp: '男の人', ro: 'otoko no hito', en: 'man', id: 'pria' },
    { jp: '女の人', ro: 'onna no hito', en: 'woman', id: 'wanita' },
  ];
  const out = [];
  for (const demo of demos) {
    for (const who of people) {
      const { jp, particles } = seg(demo.jp, who.jp, P('は'), 'だれです', P('か'));
      out.push({
        jp,
        particles,
        ro: `${demo.ro} ${who.ro} wa dare desu ka`,
        en: `Who is ${demo.en} ${who.en}${demo.there ? ' over there' : ''}?`,
        id: `Siapa ${who.id} ${demo.id}?`,
      });
    }
  }
  templates.push(['question: [demo] [person] は だれですか', out]);
}

// Q2. [demo] は なんの [item] ですか (e.g. それはなんの音楽ですか)
{
  const demos = [
    { jp: 'これ', ro: 'kore', en: 'this', id: 'ini' },
    { jp: 'それ', ro: 'sore', en: 'that', id: 'itu' },
    { jp: 'あれ', ro: 'are', en: 'that', id: 'itu di sana', there: true },
  ];
  const out = [];
  for (const demo of demos) {
    for (const item of [hon, kuruma, ongaku, ocha, eiga]) {
      const { jp, particles } = seg(demo.jp, P('は'), 'なん', P('の'), item.jp, 'です', P('か'));
      out.push({
        jp,
        particles,
        ro: `${demo.ro} wa nan no ${item.ro} desu ka`,
        en: `What kind of ${item.en.replace(/^(a|an|the) /, '')} is ${demo.en}${demo.there ? ' over there' : ''}?`,
        id: `${demo.id === 'ini' ? 'Ini' : 'Itu'} ${item.id} apa?`,
      });
    }
  }
  templates.push(['question: [demo] は なんの [item] ですか', out]);
}

// Q3. 今、[hour]ですか / 今、[hour]半ですか (e.g. 今、二時ですか)
{
  const halfHours = hours.slice(0, 9).map((hour, index) => ({
    jp: `${hour.jp}半`,
    ro: `${hour.ro} han`,
    en: `half past ${hour.en.replace(" o'clock", '')}`,
    id: `jam setengah ${hours[index + 1].id.replace('jam ', '')}`,
  }));
  const out = [];
  for (const hour of [...hours, ...halfHours]) {
    const { jp, particles } = seg('今、', hour.jp, 'です', P('か'));
    out.push({
      jp,
      particles,
      ro: `ima ${hour.ro} desu ka`,
      en: `Is it ${hour.en} now?`,
      id: `Sekarang ${hour.id}?`,
    });
  }
  templates.push(['question: 今、[hour]ですか', out]);
}

// Q4. [demo] [noun] は [adjective] ですか (e.g. この店は安いですか)
{
  const demos = [
    { jp: 'この', ro: 'kono', en: 'this', id: 'ini' },
    { jp: 'その', ro: 'sono', en: 'that', id: 'itu' },
    { jp: 'あの', ro: 'ano', en: 'that', id: 'itu', there: true },
  ];
  const nouns = [
    { item: hon, adjs: [atarashii, furui, takai, yasui] },
    { item: kuruma, adjs: [atarashii, furui, takai, yasui, ookii, chiisai, shiroi, kuroi, aoi] },
    { item: obj('店', 'mise', 'shop', 'toko'), adjs: [atarashii, furui, ookii, chiisai, yasui] },
    { item: mountain, adjs: [takai, ookii] },
    { item: river, adjs: [nagai, ookii, chiisai] },
    { item: school, adjs: [atarashii, furui, ookii, chiisai] },
    { item: station, adjs: [atarashii, furui, ookii, chiisai] },
    { item: kaban, adjs: [atarashii, furui, ookii, chiisai, takai, yasui] },
    { item: terebi, adjs: [atarashii, furui, ookii, chiisai, takai, yasui] },
  ];
  const out = [];
  for (const demo of demos) {
    for (const { item, adjs } of nouns) {
      for (const a of adjs) {
        const useAlt = item === mountain && a === takai;
        const { jp, particles } = seg(demo.jp, item.jp, P('は'), a.jp, 'です', P('か'));
        out.push({
          jp,
          particles,
          ro: `${demo.ro} ${item.ro} wa ${a.ro} desu ka`,
          en: `Is ${demo.en} ${(item.en ?? item.enNoun).replace(/^(a|an|the) /, '')}${demo.there ? ' over there' : ''} ${useAlt ? a.enAlt : a.en}?`,
          id: `Apakah ${item.id ?? item.idNoun} ${demo.id} ${useAlt ? a.idAlt : a.id}?`,
        });
      }
    }
  }
  templates.push(['question: [demo] [noun] は [adjective] ですか', out]);
}

// Q5. [time] [person] は [object] を [verb]ますか (e.g. あなたはコーヒーを飲みますか)
{
  const pairs = [
    [mizu, drink], [ocha, drink], [coffee, drink], [milk, drink],
    [gohan, eat], [asagohan, eat], [pan, eat], [fish, eat], [meat, eat], [egg, eat], [ramen, eat], [sushi, eat], [apple, eat],
    [hon, readV], [shinbun, readV], [zasshi, readV],
    [tegami, writeV], [kanjiObj, writeV], [hiraganaObj, writeV], [katakanaObj, writeV],
    [terebi, watchV], [eiga, watchV],
    [kaban, buy], [tokei, buy], [hana, buy],
    [ongaku, listen],
  ];
  const out = [];
  for (const p of [anata, gakusei, sensei, tomodachi, chichi, haha, otokonoko, onnanoko, kare, kanojo]) {
    for (const [item, v] of pairs) {
      for (const t of [noTime, mainichi, kinou, ashita]) {
        const past = t.tense === 'past';
        const future = t.tense === 'future';
        const { jp, particles } = seg(t.jp ? t.jp + '、' : '', p.jp, P('は'), item.jp, P('を'), past ? v.jpPast : v.jp, P('か'));
        out.push({
          jp,
          particles,
          ro: `${t.ro ? t.ro + ' ' : ''}${p.ro} wa ${item.ro} wo ${past ? v.roPast : v.ro} ka`,
          en: `${past ? 'Did' : future ? 'Will' : p.third ? 'Does' : 'Do'} ${p.en} ${past || future ? v.en : p.third ? v.en3 : v.en} ${item.en}${trailing(t.en.toLowerCase())}?`,
          id: `Apakah ${t.id ? t.id.toLowerCase() + ' ' : ''}${p.id.toLowerCase()} ${v.id} ${item.id}?`,
        });
      }
    }
  }
  templates.push(['question: [time] [person] は [object] を [verb]ますか', out]);
}

// Q6. [person] は [place] へ 行きますか (e.g. あなたはあした学校へ行きますか)
{
  const out = [];
  for (const p of [anata, gakusei, sensei, tomodachi, chichi, haha, kare, kanojo]) {
    for (const pl of [school, station, shop, japan, park, departmentStore, supermarket, mountain]) {
      for (const t of [noTime, ashita, kinou]) {
        const past = t.tense === 'past';
        const future = t.tense === 'future';
        const { jp, particles } = seg(t.jp ? t.jp + '、' : '', p.jp, P('は'), pl.jp, P('へ'), past ? '行きました' : '行きます', P('か'));
        out.push({
          jp,
          particles,
          ro: `${t.ro ? t.ro + ' ' : ''}${p.ro} wa ${pl.ro} e ${past ? 'ikimashita' : 'ikimasu'} ka`,
          en: `${past ? 'Did' : future ? 'Will' : p.third ? 'Does' : 'Do'} ${p.en} go ${pl.enTo}${trailing(t.en.toLowerCase())}?`,
          id: past
            ? `Apakah kemarin ${p.id.toLowerCase()} pergi ${pl.idTo}?`
            : future
              ? `Apakah ${p.id.toLowerCase()} akan pergi ${pl.idTo} besok?`
              : `Apakah ${p.id.toLowerCase()} pergi ${pl.idTo}?`,
        });
      }
    }
  }
  templates.push(['question: [person] は [place] へ 行きますか', out]);
}

// Q7. [person] は [place] に いますか (e.g. 学生は今店にいますか)
{
  const out = [];
  for (const p of [anata, gakusei, sensei, tomodachi, kare, kanojo]) {
    for (const pl of [school, station, shop, home, park]) {
      for (const withNow of [false, true]) {
        const { jp, particles } = seg(p.jp, P('は'), withNow ? '今' : '', pl.jp, P('に'), 'います', P('か'));
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${withNow ? 'ima ' : ''}${pl.ro} ni imasu ka`,
          en: `${p.third ? 'Is' : 'Are'} ${p.en} ${pl.enAt}${withNow ? ' now' : ''}?`,
          id: `Apakah ${p.id.toLowerCase()} ada di ${pl.idAt.replace('di ', '')}${withNow ? ' sekarang' : ''}?`,
        });
      }
    }
  }
  templates.push(['question: [person] は [place] に いますか', out]);
}

// Q8. [place] に [thing] が ありますか (e.g. 店にパンがありますか)
{
  const combos = [
    [shop, [pan, mizu, hon, obj('テレビ', 'terebi', 'a TV', 'TV'), hana]],
    [departmentStore, [pan, mizu, hon, obj('テレビ', 'terebi', 'a TV', 'TV'), hana]],
    [supermarket, [pan, mizu, fish, meat, egg, apple]],
    [japan, [obj('山', 'yama', 'a mountain', 'gunung'), obj('川', 'kawa', 'a river', 'sungai')]],
    [park, [hana, ki]],
  ];
  const out = [];
  for (const [pl, items] of combos) {
    for (const item of items) {
      const { jp, particles } = seg(pl.jp, P('に'), item.jp, P('が'), 'あります', P('か'));
      out.push({
        jp,
        particles,
        ro: `${pl.ro} ni ${item.ro} ga arimasu ka`,
        en: `Is there ${item.en} ${pl.enAt}?`,
        id: `Apakah ada ${item.id} ${pl.idAt}?`,
      });
    }
  }
  templates.push(['question: [place] に [thing] が ありますか', out]);
}

// Q9. [person] は [thing] が すきですか (e.g. あなたはコーヒーがすきですか)
{
  // "Do you like apples?" reads better than "Do you like an apple?"
  const likeItem = (en) => {
    if (!/^an? /.test(en)) return en;
    const bare = en.replace(/^an? /, '');
    return bare.endsWith('y') ? `${bare.slice(0, -1)}ies` : `${bare}${/(s|ch|sh|x)$/.test(bare) ? 'es' : 's'}`;
  };
  const out = [];
  for (const p of [anata, gakusei, sensei, tomodachi, chichi, haha, kare, kanojo]) {
    for (const item of [coffee, ocha, sushi, apple, ongaku, eiga, obj('日本', 'nihon', 'Japan', 'Jepang')]) {
      const { jp, particles } = seg(p.jp, P('は'), item.jp, P('が'), 'すきです', P('か'));
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ${item.ro} ga suki desu ka`,
        en: `${p.third ? 'Does' : 'Do'} ${p.en} like ${likeItem(item.en)}?`,
        id: `Apakah ${p.id.toLowerCase()} suka ${item.id}?`,
      });
    }
  }
  templates.push(['question: [person] は [thing] が すきですか', out]);
}

// Q10. [person] は [language] を 話します / 読みます / 書きますか
{
  const languages = [
    obj('日本語', 'nihongo', 'Japanese', 'bahasa Jepang'),
    obj('えいご', 'eigo', 'English', 'bahasa Inggris'),
    obj('ちゅうごくご', 'chuugokugo', 'Chinese', 'bahasa Mandarin'),
  ];
  const out = [];
  for (const p of [anata, gakusei, sensei, tomodachi, kare, kanojo]) {
    for (const lang of languages) {
      for (const v of [speak, readV, writeV]) {
        const { jp, particles } = seg(p.jp, P('は'), lang.jp, P('を'), v.jp, P('か'));
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${lang.ro} wo ${v.ro} ka`,
          en: `${p.third ? 'Does' : 'Do'} ${p.en} ${p.third ? v.en3 : v.en} ${lang.en}?`,
          id: `Apakah ${p.id.toLowerCase()} ${v.id} ${lang.id}?`,
        });
      }
    }
  }
  templates.push(['question: [person] は [language] を [verb]ますか', out]);
}

// Q11. [time] は [day] ですか (e.g. あしたは水曜日ですか / きのうは日曜日でしたか)
{
  const out = [];
  for (const day of days) {
    const today = seg('今日', P('は'), day.jp, 'です', P('か'));
    out.push({
      jp: today.jp,
      particles: today.particles,
      ro: `kyou wa ${day.ro} desu ka`,
      en: `Is today ${day.en}?`,
      id: `Apakah hari ini hari ${day.id}?`,
    });
    const tomorrow = seg('あした', P('は'), day.jp, 'です', P('か'));
    out.push({
      jp: tomorrow.jp,
      particles: tomorrow.particles,
      ro: `ashita wa ${day.ro} desu ka`,
      en: `Is tomorrow ${day.en}?`,
      id: `Apakah besok hari ${day.id}?`,
    });
    const yesterday = seg('きのう', P('は'), day.jp, 'でした', P('か'));
    out.push({
      jp: yesterday.jp,
      particles: yesterday.particles,
      ro: `kinou wa ${day.ro} deshita ka`,
      en: `Was yesterday ${day.en}?`,
      id: `Apakah kemarin hari ${day.id}?`,
    });
  }
  templates.push(['question: [time] は [day] ですか', out]);
}

// Q12. [person] は [place] で [object] を [verb]ますか (e.g. あなたはうちでごはんを食べますか)
{
  const combos = [
    [shop, [mizu, hon, kaban, tokei, hana, pan, terebi, kuruma], buy],
    [departmentStore, [mizu, hon, kaban, tokei, hana, pan, terebi], buy],
    [supermarket, [mizu, pan, fish, meat, egg, apple], buy],
    [home, [gohan, pan, ramen, sushi, apple], eat],
    [shop, [gohan, pan, ramen], eat],
    [restaurant, [gohan, ramen, sushi], eat],
    [home, [mizu, ocha, coffee, milk], drink],
    [restaurant, [ocha, coffee, milk], drink],
    [home, [terebi, eiga], watchV],
    [school, [hon, shinbun, zasshi], readV],
    [home, [hon, shinbun, zasshi], readV],
    [home, [ongaku], listen],
  ];
  const out = [];
  for (const p of [anata, gakusei, sensei, tomodachi, chichi, haha, kare, kanojo]) {
    for (const [pl, items, v] of combos) {
      for (const item of items) {
        const { jp, particles } = seg(p.jp, P('は'), pl.jp, P('で'), item.jp, P('を'), v.jp, P('か'));
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${pl.ro} de ${item.ro} wo ${v.ro} ka`,
          en: `${p.third ? 'Does' : 'Do'} ${p.en} ${p.third ? v.en3 : v.en} ${item.en} ${pl.enAt}?`,
          id: `Apakah ${p.id.toLowerCase()} ${v.id} ${item.id} di ${pl.idAt.replace('di ', '')}?`,
        });
      }
    }
  }
  templates.push(['question: [person] は [place] で [object] を [verb]ますか', out]);
}

// Q13. [person] は なんじに [verb]ますか / まいあさ [hour] に おきますか
{
  const out = [];
  for (const p of [anata, gakusei, sensei, tomodachi, chichi, haha, kare, kanojo]) {
    for (const [v, vEn] of [[okiru, 'wake up'], [neru, 'go to sleep']]) {
      const at = seg(p.jp, P('は'), 'なんじ', P('に'), v.jp, P('か'));
      out.push({
        jp: at.jp,
        particles: at.particles,
        ro: `${p.ro} wa nanji ni ${v.ro} ka`,
        en: `What time ${p.third ? 'does' : 'do'} ${p.en} ${vEn}?`,
        id: `Jam berapa ${p.id.toLowerCase()} ${v.id}?`,
      });
    }
    for (const hour of hours.slice(4, 10)) {
      const morning = seg(p.jp, P('は'), 'まいあさ', hour.jp, P('に'), 'おきます', P('か'));
      out.push({
        jp: morning.jp,
        particles: morning.particles,
        ro: `${p.ro} wa maiasa ${hour.ro} ni okimasu ka`,
        en: `${p.third ? 'Does' : 'Do'} ${p.en} wake up at ${hour.en.replace(" o'clock", '')} every morning?`,
        id: `Apakah ${p.id.toLowerCase()} bangun ${hour.id} setiap pagi?`,
      });
    }
    for (const hour of hours.slice(7, 10)) {
      const evening = seg(p.jp, P('は'), 'ごご', hour.jp, P('に'), 'ねます', P('か'));
      out.push({
        jp: evening.jp,
        particles: evening.particles,
        ro: `${p.ro} wa gogo ${hour.ro} ni nemasu ka`,
        en: `${p.third ? 'Does' : 'Do'} ${p.en} go to sleep at ${hour.en.replace(" o'clock", '')} p.m.?`,
        id: `Apakah ${p.id.toLowerCase()} tidur ${hour.id} malam?`,
      });
    }
  }
  templates.push(['question: [person] は なんじに おきます / ねます か', out]);
}

// Q14. いっしょに [place] へ 行きませんか (e.g. あした、いっしょにこうえんへ行きませんか)
{
  const out = [];
  for (const pl of [park, station, shop, departmentStore, supermarket, mountain, river, ginkou, daigaku, kuukou]) {
    for (const t of [noTime, ashita]) {
      const { jp, particles } = seg(t.jp ? t.jp + '、' : '', 'いっしょに', pl.jp, P('へ'), '行きません', P('か'));
      out.push({
        jp,
        particles,
        ro: `${t.ro ? t.ro + ' ' : ''}issho ni ${pl.ro} e ikimasen ka`,
        en: `Won't you go ${pl.enTo} together${trailing(t.en.toLowerCase())}?`,
        id: t.id ? `${t.id} mau pergi ${pl.idTo} bersama-sama?` : `Mau pergi ${pl.idTo} bersama-sama?`,
      });
    }
  }
  templates.push(['question: いっしょに [place] へ 行きませんか', out]);
}

// ---------- N5 / N4 grammar templates ----------
// The most common grammar of the JLPT N5 and N4 levels that the templates
// above don't cover: negative and past negative, wanting, inviting, asking,
// te-form patterns, permission, prohibition, experience, ability, plans,
// obligation, comparison and giving an opinion.
//
// Every template is pushed with { jlpt, pattern }: the JLPT level of its
// grammar, and the grammar pattern of the menu filter (its ending can't tell
// it: 〜ています ends like います, 〜てください like です). Each sentence also
// carries "gloss": meanings of its conjugated words for the word breakdown
// (written to src/generatedGlossary.js).

// Conjugations of the verbs used below: masu-stem, te-form, ta-form,
// dictionary form and nai-stem (romaji and kana), plus English -ing and past
// participle and the Indonesian command form
const conjugate = (v, [stem, stemRo], [te, teRo], [ta, taRo], [dict, dictRo], [nai, naiRo], enIng, enPP, idCmd) =>
  ({ ...v, stem, stemRo, te, teRo, ta, taRo, dict, dictRo, nai, naiRo, enIng, enPP, idCmd });

const cDrink = conjugate(drink, ['飲み', 'nomi'], ['飲んで', 'nonde'], ['飲んだ', 'nonda'], ['飲む', 'nomu'], ['飲ま', 'noma'], 'drinking', 'drunk', 'minum');
const cEat = conjugate(eat, ['食べ', 'tabe'], ['食べて', 'tabete'], ['食べた', 'tabeta'], ['食べる', 'taberu'], ['食べ', 'tabe'], 'eating', 'eaten', 'makan');
const cRead = conjugate(readV, ['読み', 'yomi'], ['読んで', 'yonde'], ['読んだ', 'yonda'], ['読む', 'yomu'], ['読ま', 'yoma'], 'reading', 'read', 'baca');
const cWrite = conjugate(writeV, ['書き', 'kaki'], ['書いて', 'kaite'], ['書いた', 'kaita'], ['書く', 'kaku'], ['書か', 'kaka'], 'writing', 'written', 'tulis');
const cWatch = conjugate(watchV, ['見', 'mi'], ['見て', 'mite'], ['見た', 'mita'], ['見る', 'miru'], ['見', 'mi'], 'watching', 'seen', 'tonton');
const cBuy = conjugate(buy, ['買い', 'kai'], ['買って', 'katte'], ['買った', 'katta'], ['買う', 'kau'], ['買わ', 'kawa'], 'buying', 'bought', 'beli');
const cListen = conjugate(listen, ['聞き', 'kiki'], ['聞いて', 'kiite'], ['聞いた', 'kiita'], ['聞く', 'kiku'], ['聞か', 'kika'], 'listening to', 'listened to', 'dengarkan');
const cSpeak = conjugate(speak, ['話し', 'hanashi'], ['話して', 'hanashite'], ['話した', 'hanashita'], ['話す', 'hanasu'], ['話さ', 'hanasa'], 'speaking', 'spoken', 'bicara');
const cGo = conjugate(go, ['行き', 'iki'], ['行って', 'itte'], ['行った', 'itta'], ['行く', 'iku'], ['行か', 'ika'], 'going', 'been', 'pergi');
const cReturn = conjugate(returnHome, ['帰り', 'kaeri'], ['帰って', 'kaette'], ['帰った', 'kaetta'], ['帰る', 'kaeru'], ['帰ら', 'kaera'], 'going home', 'gone home', 'pulang');
const cStudy = conjugate(study, ['べんきょうし', 'benkyou shi'], ['べんきょうして', 'benkyou shite'], ['べんきょうした', 'benkyou shita'], ['べんきょうする', 'benkyou suru'], ['べんきょうし', 'benkyou shi'], 'studying', 'studied', 'belajar');
const cMake = conjugate(
  verb('つくります', 'tsukurimasu', 'つくりました', 'tsukurimashita', 'make', 'makes', 'will make', 'made', 'membuat'),
  ['つくり', 'tsukuri'], ['つくって', 'tsukutte'], ['つくった', 'tsukutta'], ['つくる', 'tsukuru'], ['つくら', 'tsukura'], 'making', 'made', 'buat');
const cTake = conjugate(
  verb('とります', 'torimasu', 'とりました', 'torimashita', 'take', 'takes', 'will take', 'took', 'mengambil'),
  ['とり', 'tori'], ['とって', 'totte'], ['とった', 'totta'], ['とる', 'toru'], ['とら', 'tora'], 'taking', 'taken', 'ambil');

const shashin = obj('しゃしん', 'shashin', 'photos', 'foto');
const nihongoObj = obj('日本語', 'nihongo', 'Japanese', 'bahasa Jepang');
const eigoObj = obj('えいご', 'eigo', 'English', 'bahasa Inggris');

// Object + verb pairs that read naturally without an article ("drink coffee")
const plainPairs = [
  [mizu, cDrink], [ocha, cDrink], [coffee, cDrink], [milk, cDrink], [juusu, cDrink],
  [gohan, cEat], [pan, cEat], [fish, cEat], [meat, cEat], [sushi, cEat], [ramen, cEat],
  [shinbun, cRead], [kanjiObj, cWrite], [hiraganaObj, cWrite], [katakanaObj, cWrite],
  [terebi, cWatch], [ongaku, cListen], [nihongoObj, cStudy], [kanjiObj, cStudy],
];
// Pairs whose object takes an article in English ("read a book")
const articlePairs = [
  [hon, cRead], [zasshi, cRead], [tegami, cWrite], [eiga, cWatch],
  [kaban, cBuy], [tokei, cBuy], [hana, cBuy],
];
const allPairs = [...plainPairs, ...articlePairs];
const people = [watashi, anata, gakusei, sensei, tomodachi, chichi, haha];
const beVerb = (p) => (p === watashi ? 'am' : p === anata ? 'are' : 'is');
// "Ayah saya" at the start of a sentence, "ayah saya" after a time word
const idSubject = (t, p) => (t.id ? `${t.id} ${p.idPoss}` : p.id);
const timeComma = (t) => (t.jp ? t.jp + '、' : '');
const timeRo = (t) => (t.ro ? t.ro + ' ' : '');

// N5-1. 〜ません / 〜ませんでした (e.g. 父はコーヒーを飲みません)
{
  const out = [];
  for (const p of people) {
    for (const [item, v] of plainPairs) {
      for (const t of [noTime, mainichi, kinou, senshuu]) {
        const past = t.tense === 'past';
        const ending = past ? 'ませんでした' : 'ません';
        const { jp, particles } = seg(timeComma(t), p.jp, P('は'), item.jp, P('を'), v.stem + ending);
        out.push({
          jp,
          particles,
          ro: `${timeRo(t)}${p.ro} wa ${item.ro} wo ${v.stemRo}${past ? 'masen deshita' : 'masen'}`,
          en: `${cap(p.en)} ${past ? "didn't" : p.third ? "doesn't" : "don't"} ${v.en} ${item.en}${trailing(t.en.toLowerCase())}`,
          id: `${idSubject(t, p)} tidak ${v.id} ${item.id}`,
          gloss: { [v.stem + 'ません']: [`don't ${v.en}`, `tidak ${v.id}`] },
        });
      }
    }
  }
  templates.push(['N5 negative: [person] は [object] を [verb]ません / ませんでした', out, { jlpt: 'N5', pattern: 'verb' }]);
}

// N5-2. 〜たいです (e.g. わたしは日本へ行きたいです)
{
  const out = [];
  for (const t of [noTime, ashita, raishuu]) {
    for (const [item, v] of allPairs) {
      const { jp, particles } = seg(timeComma(t), 'わたし', P('は'), item.jp, P('を'), v.stem + 'たいです');
      out.push({
        jp,
        particles,
        ro: `${timeRo(t)}watashi wa ${item.ro} wo ${v.stemRo}tai desu`,
        en: `I want to ${v.en} ${item.en}${trailing(t.en.toLowerCase())}`,
        id: cap(`${t.id ? t.id.toLowerCase() + ' ' : ''}saya ingin ${v.id} ${item.id}`),
        gloss: { [v.stem + 'たい']: [`want to ${v.en}`, `ingin ${v.id}`] },
      });
    }
    for (const pl of [japan, foreignCountry, park, mountain, river, restaurant, departmentStore]) {
      const { jp, particles } = seg(timeComma(t), 'わたし', P('は'), pl.jp, P('へ'), '行きたいです');
      out.push({
        jp,
        particles,
        ro: `${timeRo(t)}watashi wa ${pl.ro} e ikitai desu`,
        en: `I want to go ${pl.enTo}${trailing(t.en.toLowerCase())}`,
        id: cap(`${t.id ? t.id.toLowerCase() + ' ' : ''}saya ingin pergi ${pl.idTo}`),
        gloss: { '行きたい': ['want to go', 'ingin pergi'] },
      });
    }
  }
  templates.push(['N5 want: わたしは [object] を [verb]たいです', out, { jlpt: 'N5', pattern: 'verb' }]);
}

// N5-3. 〜ましょう (e.g. いっしょにすしを食べましょう)
{
  const out = [];
  for (const t of [noTime, ashita]) {
    for (const [item, v] of allPairs.filter(([, v]) => v !== cStudy)) {
      const { jp, particles } = seg(timeComma(t), 'いっしょに', item.jp, P('を'), v.stem + 'ましょう');
      out.push({
        jp,
        particles,
        ro: `${timeRo(t)}issho ni ${item.ro} wo ${v.stemRo}mashou`,
        en: `Let's ${v.en} ${item.en} together${trailing(t.en.toLowerCase())}`,
        id: `${t.id ? t.id + ', ayo' : 'Ayo'} ${v.idCmd} ${item.id} bersama-sama`,
        gloss: { [v.stem + 'ましょう']: [`let's ${v.en}`, `ayo ${v.idCmd}`] },
      });
    }
    for (const pl of [park, station, mountain, river, restaurant, departmentStore, supermarket]) {
      const { jp, particles } = seg(timeComma(t), 'いっしょに', pl.jp, P('へ'), '行きましょう');
      out.push({
        jp,
        particles,
        ro: `${timeRo(t)}issho ni ${pl.ro} e ikimashou`,
        en: `Let's go ${pl.enTo} together${trailing(t.en.toLowerCase())}`,
        id: `${t.id ? t.id + ', ayo' : 'Ayo'} pergi ${pl.idTo} bersama-sama`,
        gloss: { '行きましょう': ["let's go", 'ayo pergi'] },
      });
    }
  }
  templates.push(['N5 invite: いっしょに [object] を [verb]ましょう', out, { jlpt: 'N5', pattern: 'verb' }]);
}

// N5-4. 〜てください (e.g. 本を読んでください)
{
  const out = [];
  for (const [item, v] of allPairs) {
    const { jp, particles } = seg(item.jp, P('を'), v.te + 'ください');
    out.push({
      jp,
      particles,
      ro: `${item.ro} wo ${v.teRo} kudasai`,
      en: `Please ${v.en} ${item.en}`,
      id: `Tolong ${v.idCmd} ${item.id}`,
      gloss: { [v.te + 'ください']: [`please ${v.en}`, `tolong ${v.idCmd}`] },
    });
  }
  for (const pl of [school, station, home, park, ginkou, kuukou]) {
    const { jp, particles } = seg(pl.jp, P('へ'), '行ってください');
    out.push({
      jp,
      particles,
      ro: `${pl.ro} e itte kudasai`,
      en: `Please go ${pl.enTo}`,
      id: `Tolong pergi ${pl.idTo}`,
      gloss: { '行ってください': ['please go', 'tolong pergi'] },
    });
  }
  templates.push(['N5 request: [object] を [verb]てください', out, { jlpt: 'N5', pattern: 'verb' }]);
}

// N5-5. 〜ています (e.g. 母は今パンを食べています)
{
  const out = [];
  for (const p of people) {
    for (const [item, v] of allPairs.filter(([, v]) => v !== cBuy)) {
      // 今、 with a comma: 今日本語 would read as 今日 (today) + 本語
      const { jp, particles } = seg(p.jp, P('は'), '今、', item.jp, P('を'), v.te + 'います');
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ima ${item.ro} wo ${v.teRo} imasu`,
        en: `${cap(p.en)} ${beVerb(p)} ${v.enIng} ${item.en} now`,
        id: `${p.id} sedang ${v.id} ${item.id} sekarang`,
        gloss: { [v.te + 'います']: [`is ${v.enIng}`, `sedang ${v.id}`] },
      });
    }
  }
  templates.push(['N5 progressive: [person] は 今 [object] を [verb]ています', out, { jlpt: 'N5', pattern: 'verb' }]);
}

// N5-6. Adjective negative 〜くないです (e.g. この本は高くないです)
{
  const demos = [
    { jp: 'この', ro: 'kono', en: 'This', id: 'ini' },
    { jp: 'その', ro: 'sono', en: 'That', id: 'itu' },
  ];
  const nouns = [
    [obj('本', 'hon', 'book', 'buku'), [atarashii, furui, takai, yasui, nagai]],
    [obj('車', 'kuruma', 'car', 'mobil'), [atarashii, furui, takai, yasui, ookii, chiisai]],
    [obj('かばん', 'kaban', 'bag', 'tas'), [atarashii, furui, takai, yasui, ookii, chiisai, kuroi]],
    [obj('テレビ', 'terebi', 'TV', 'TV'), [atarashii, furui, takai, yasui, ookii, chiisai]],
    [obj('へや', 'heya', 'room', 'kamar'), [atarashii, furui, ookii, chiisai]],
    [obj('川', 'kawa', 'river', 'sungai'), [nagai, ookii, chiisai]],
  ];
  const out = [];
  for (const demo of demos) {
    for (const [item, adjs] of nouns) {
      for (const a of adjs) {
        const stemJp = a.jp.slice(0, -1);
        const stemRo = a.ro.slice(0, -1);
        const { jp, particles } = seg(demo.jp, item.jp, P('は'), stemJp + 'くないです');
        out.push({
          jp,
          particles,
          ro: `${demo.ro} ${item.ro} wa ${stemRo}kunai desu`,
          en: `${demo.en} ${item.en} is not ${a.en}`,
          id: `${cap(item.id)} ${demo.id} tidak ${a.id}`,
          gloss: { [stemJp + 'くない']: [`not ${a.en}`, `tidak ${a.id}`] },
        });
      }
    }
  }
  templates.push(['N5 adjective negative: [noun] は [adjective]くないです', out, { jlpt: 'N5', pattern: 'desu' }]);
}

// N5-7. 〜がほしいです (e.g. わたしは新しい車がほしいです)
{
  const out = [];
  const things = [kaban, tokei, kuruma, hon, obj('テレビ', 'terebi', 'a TV', 'TV'), obj('じてんしゃ', 'jitensha', 'a bicycle', 'sepeda')];
  for (const item of things) {
    for (const a of [null, atarashii, ookii, chiisai, shiroi, kuroi, aoi]) {
      const thingJp = a ? a.jp + item.jp : item.jp;
      const thingRo = a ? `${a.ro} ${item.ro}` : item.ro;
      const en = a ? item.en.replace(/^an? /, `a ${a.en} `).replace(/^a ([aeiou])/, 'an $1') : item.en;
      const { jp, particles } = seg('わたし', P('は'), thingJp, P('が'), 'ほしいです');
      out.push({
        jp,
        particles,
        ro: `watashi wa ${thingRo} ga hoshii desu`,
        en: `I want ${en}`,
        id: `Saya ingin ${item.id}${a ? ' ' + a.id : ''}`,
        gloss: { 'ほしい': ['want (to have)', 'ingin (memiliki)'] },
      });
    }
  }
  templates.push(['N5 want something: わたしは [thing] が ほしいです', out, { jlpt: 'N5', pattern: 'desu' }]);
}

// N5-8. Comparison 〜は〜より〜です (e.g. 車はじてんしゃより高いです)
{
  const thing = (jp, ro, en, id) => ({ jp, ro, en, id });
  const comparisons = [
    [thing('車', 'kuruma', 'A car', 'Mobil'), thing('じてんしゃ', 'jitensha', 'a bicycle', 'sepeda'), '高い', 'takai', 'more expensive', 'mahal'],
    [thing('山', 'yama', 'A mountain', 'Gunung'), thing('木', 'ki', 'a tree', 'pohon'), '高い', 'takai', 'higher', 'tinggi'],
    [thing('ひこうき', 'hikouki', 'A plane', 'Pesawat'), thing('電車', 'densha', 'a train', 'kereta'), 'はやい', 'hayai', 'faster', 'cepat'],
    [thing('電車', 'densha', 'A train', 'Kereta'), thing('バス', 'basu', 'a bus', 'bus'), 'はやい', 'hayai', 'faster', 'cepat'],
    [thing('なつ', 'natsu', 'Summer', 'Musim panas'), thing('はる', 'haru', 'spring', 'musim semi'), 'あつい', 'atsui', 'hotter', 'panas'],
    [thing('ふゆ', 'fuyu', 'Winter', 'Musim dingin'), thing('あき', 'aki', 'autumn', 'musim gugur'), 'さむい', 'samui', 'colder', 'dingin'],
    [thing('日本語', 'nihongo', 'Japanese', 'Bahasa Jepang'), thing('えいご', 'eigo', 'English', 'bahasa Inggris'), 'むずかしい', 'muzukashii', 'more difficult', 'sulit'],
    [thing('かんじ', 'kanji', 'Kanji', 'Kanji'), thing('ひらがな', 'hiragana', 'hiragana', 'hiragana'), 'むずかしい', 'muzukashii', 'more difficult', 'sulit'],
    [thing('本', 'hon', 'A book', 'Buku'), thing('ざっし', 'zasshi', 'a magazine', 'majalah'), '高い', 'takai', 'more expensive', 'mahal'],
    [thing('学校', 'gakkou', 'The school', 'Sekolah'), thing('駅', 'eki', 'the station', 'stasiun'), '大きい', 'ookii', 'bigger', 'besar'],
    [thing('川', 'kawa', 'The river', 'Sungai'), thing('山', 'yama', 'the mountain', 'gunung'), '長い', 'nagai', 'longer', 'panjang'],
    [thing('コーヒー', 'koohii', 'Coffee', 'Kopi'), thing('おちゃ', 'ocha', 'tea', 'teh'), '高い', 'takai', 'more expensive', 'mahal'],
    [thing('父', 'chichi', 'My father', 'Ayah saya'), thing('母', 'haha', 'my mother', 'ibu saya'), '大きい', 'ookii', 'bigger', 'besar'],
    [thing('へや', 'heya', 'The room', 'Kamar'), thing('うち', 'uchi', 'the house', 'rumah'), '小さい', 'chiisai', 'smaller', 'kecil'],
  ];
  const out = [];
  for (const [a, b, adjJp, adjRo, enMore, idAdj] of comparisons) {
    const { jp, particles } = seg(a.jp, P('は'), b.jp, P('より'), adjJp + 'です');
    out.push({
      jp,
      particles,
      ro: `${a.ro} wa ${b.ro} yori ${adjRo} desu`,
      en: `${a.en} is ${enMore} than ${b.en}`,
      id: `${a.id} lebih ${idAdj} daripada ${b.id}`,
      gloss: {
        'はやい': ['fast', 'cepat'],
        'むずかしい': ['difficult', 'sulit'],
        'はる': ['spring', 'musim semi'],
      },
    });
  }
  templates.push(['N5 comparison: [A] は [B] より [adjective] です', out, { jlpt: 'N5', pattern: 'desu' }]);
}

// N4-1. 〜てもいいですか (e.g. ここでしゃしんをとってもいいですか)
{
  const out = [];
  const pairs = [...allPairs.filter(([, v]) => v !== cStudy), [shashin, cTake]];
  for (const where of [null, { jp: 'ここ', ro: 'koko', en: ' here', id: ' di sini' }]) {
    for (const [item, v] of pairs) {
      const { jp, particles } = seg(where ? where.jp : '', ...(where ? [P('で')] : []), item.jp, P('を'), v.te, P('も'), 'いいです', P('か'));
      out.push({
        jp,
        particles,
        ro: `${where ? where.ro + ' de ' : ''}${item.ro} wo ${v.teRo} mo ii desu ka`,
        en: `May I ${v.en} ${item.en}${where ? where.en : ''}?`,
        id: `Bolehkah saya ${v.id} ${item.id}${where ? where.id : ''}?`,
        gloss: { [v.te]: [`${v.en} (te-form)`, `${v.id} (bentuk -te)`], 'いい': ['good / all right', 'baik / boleh'] },
      });
    }
  }
  templates.push(['N4 permission: [object] を [verb]てもいいですか', out, { jlpt: 'N4', pattern: 'question' }]);
}

// N4-2. 〜てはいけません (e.g. 電車の中で電話をしてはいけません)
{
  const out = [];
  const places = [
    { parts: ['ここ'], ro: 'koko', en: 'here', id: 'di sini' },
    { parts: ['電車', P('の'), '中'], ro: 'densha no naka', en: 'on the train', id: 'di dalam kereta' },
    { parts: ['へや'], ro: 'heya', en: 'in the room', id: 'di kamar' },
    { parts: ['学校'], ro: 'gakkou', en: 'at school', id: 'di sekolah' },
  ];
  const pairs = [[pan, cEat], [ramen, cEat], [sushi, cEat], [coffee, cDrink], [juusu, cDrink], [shashin, cTake], [terebi, cWatch]];
  for (const pl of places) {
    for (const [item, v] of pairs) {
      const { jp, particles } = seg(...pl.parts, P('で'), item.jp, P('を'), v.te, P('は'), 'いけません');
      out.push({
        jp,
        particles,
        ro: `${pl.ro} de ${item.ro} wo ${v.teRo} wa ikemasen`,
        en: `You must not ${v.en} ${item.en} ${pl.en}`,
        id: `Tidak boleh ${v.id} ${item.id} ${pl.id}`,
        gloss: { [v.te]: [`${v.en} (te-form)`, `${v.id} (bentuk -te)`], 'いけません': ['is not allowed', 'tidak boleh'] },
      });
    }
  }
  templates.push(['N4 prohibition: [place] で [object] を [verb]てはいけません', out, { jlpt: 'N4', pattern: 'verb' }]);
}

// N4-3. 〜たことがあります (e.g. わたしはすしを食べたことがあります)
{
  const out = [];
  const pairs = [[sushi, cEat], [ramen, cEat], [coffee, cDrink], [hon, cRead], [shinbun, cRead], [tegami, cWrite], [eiga, cWatch], [kanjiObj, cWrite], [nihongoObj, cStudy]];
  const forms = [
    { ending: 'あります', ro: 'arimasu', question: false, never: false },
    { ending: 'ありません', ro: 'arimasen', question: false, never: true },
    { ending: 'ありますか', ro: 'arimasu ka', question: true, never: false },
  ];
  for (const form of forms) {
    const subjects = form.question ? [anata] : [watashi, chichi, haha, tomodachi, sensei];
    for (const p of subjects) {
      for (const [item, v] of pairs) {
        const verbEnd = form.question ? [form.ending.slice(0, -1), P('か')] : [form.ending];
        const { jp, particles } = seg(p.jp, P('は'), item.jp, P('を'), v.ta, 'こと', P('が'), ...verbEnd);
        const has = p.third ? 'has' : 'have';
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${item.ro} wo ${v.taRo} koto ga ${form.ro}`,
          en: form.question
            ? `Have you ever ${v.enPP} ${item.en}?`
            : `${cap(p.en)} ${has} ${form.never ? 'never ' : ''}${v.enPP} ${item.en}${form.never ? '' : ' before'}`,
          id: form.question
            ? `Apakah Anda pernah ${v.id} ${item.id}?`
            : `${p.id} ${form.never ? 'belum pernah' : 'pernah'} ${v.id} ${item.id}`,
          gloss: {
            [v.ta]: [`${v.enPP} (past)`, `${v.id} (lampau)`],
            'こと': ['thing / experience', 'hal / pengalaman'],
            'ありません': ['there is not', 'tidak ada'],
          },
        });
      }
      if (!form.question || p === anata) {
        for (const pl of [japan, foreignCountry, mountain, kuukou]) {
          const verbEnd = form.question ? [form.ending.slice(0, -1), P('か')] : [form.ending];
          const { jp, particles } = seg(p.jp, P('は'), pl.jp, P('へ'), '行った', 'こと', P('が'), ...verbEnd);
          out.push({
            jp,
            particles,
            ro: `${p.ro} wa ${pl.ro} e itta koto ga ${form.ro}`,
            en: form.question
              ? `Have you ever been ${pl.enTo}?`
              : `${cap(p.en)} ${p.third ? 'has' : 'have'} ${form.never ? 'never ' : ''}been ${pl.enTo}${form.never ? '' : ' before'}`,
            id: form.question
              ? `Apakah Anda pernah pergi ${pl.idTo}?`
              : `${p.id} ${form.never ? 'belum pernah' : 'pernah'} pergi ${pl.idTo}`,
            gloss: {
              '行った': ['went', 'pergi (lampau)'],
              'こと': ['thing / experience', 'hal / pengalaman'],
              'ありません': ['there is not', 'tidak ada'],
            },
          });
        }
      }
    }
  }
  templates.push(['N4 experience: [person] は [object] を [verb]たことがあります', out, { jlpt: 'N4', pattern: 'verb' }]);
}

// N4-4. 〜ことができます (e.g. 母はかんじを読むことができます)
{
  const out = [];
  const pairs = [
    [kanjiObj, cRead], [kanjiObj, cWrite], [hiraganaObj, cRead], [hiraganaObj, cWrite], [katakanaObj, cRead], [katakanaObj, cWrite],
    [nihongoObj, cSpeak], [nihongoObj, cRead], [eigoObj, cSpeak], [sushi, cMake], [ramen, cMake],
  ];
  for (const p of people) {
    for (const [item, v] of pairs) {
      for (const can of [true, false]) {
        const { jp, particles } = seg(p.jp, P('は'), item.jp, P('を'), v.dict, 'こと', P('が'), can ? 'できます' : 'できません');
        out.push({
          jp,
          particles,
          ro: `${p.ro} wa ${item.ro} wo ${v.dictRo} koto ga ${can ? 'dekimasu' : 'dekimasen'}`,
          en: `${cap(p.en)} ${can ? 'can' : "can't"} ${v.en} ${item.en}`,
          id: `${p.id} ${can ? 'bisa' : 'tidak bisa'} ${v.id} ${item.id}`,
          gloss: {
            [v.dict]: [`${v.en} (dictionary form)`, `${v.id} (bentuk kamus)`],
            'こと': ['thing / experience', 'hal / pengalaman'],
            'できます': ['can, be able to', 'bisa'],
            'できません': ["can't", 'tidak bisa'],
          },
        });
      }
    }
  }
  templates.push(['N4 ability: [person] は [object] を [verb]ことができます', out, { jlpt: 'N4', pattern: 'verb' }]);
}

// N4-5. 〜つもりです (e.g. 来週、わたしは日本へ行くつもりです)
{
  const out = [];
  for (const t of [ashita, raishuu]) {
    for (const [item, v] of allPairs) {
      const { jp, particles } = seg(timeComma(t), 'わたし', P('は'), item.jp, P('を'), v.dict, 'つもりです');
      out.push({
        jp,
        particles,
        ro: `${timeRo(t)}watashi wa ${item.ro} wo ${v.dictRo} tsumori desu`,
        en: `I plan to ${v.en} ${item.en} ${t.en.toLowerCase()}`,
        id: `${t.id} saya berencana ${v.id} ${item.id}`,
        gloss: {
          [v.dict]: [`${v.en} (dictionary form)`, `${v.id} (bentuk kamus)`],
          'つもり': ['intention, plan', 'rencana, niat'],
        },
      });
    }
    for (const pl of [japan, foreignCountry, mountain, river, park, departmentStore]) {
      const { jp, particles } = seg(timeComma(t), 'わたし', P('は'), pl.jp, P('へ'), '行く', 'つもりです');
      out.push({
        jp,
        particles,
        ro: `${timeRo(t)}watashi wa ${pl.ro} e iku tsumori desu`,
        en: `I plan to go ${pl.enTo} ${t.en.toLowerCase()}`,
        id: `${t.id} saya berencana pergi ${pl.idTo}`,
        gloss: { '行く': ['go (dictionary form)', 'pergi (bentuk kamus)'], 'つもり': ['intention, plan', 'rencana, niat'] },
      });
    }
  }
  templates.push(['N4 plan: わたしは [object] を [verb]つもりです', out, { jlpt: 'N4', pattern: 'verb' }]);
}

// N4-6. 〜なければなりません (e.g. 学生はかんじをべんきょうしなければなりません)
{
  const out = [];
  const pairs = [[nihongoObj, cStudy], [kanjiObj, cStudy], [shinbun, cRead], [hon, cRead], [tegami, cWrite], [namae, cWrite], [mizu, cDrink], [kaban, cBuy]];
  for (const p of people) {
    for (const t of [noTime, kyou, ashita]) {
      for (const [item, v] of pairs) {
        const { jp, particles } = seg(timeComma(t), p.jp, P('は'), item.jp, P('を'), v.nai + 'なければなりません');
        out.push({
          jp,
          particles,
          ro: `${timeRo(t)}${p.ro} wa ${item.ro} wo ${v.naiRo}nakereba narimasen`,
          en: `${cap(p.en)} must ${v.en} ${item.en}${trailing(t.en.toLowerCase())}`,
          id: `${idSubject(t, p)} harus ${v.id} ${item.id}`,
          gloss: { [v.nai + 'なければなりません']: [`must ${v.en}`, `harus ${v.id}`] },
        });
      }
      for (const [pl, v, idVerb] of [[school, cGo, 'pergi ke sekolah'], [home, cReturn, 'pulang']]) {
        const { jp, particles } = seg(timeComma(t), p.jp, P('は'), pl.jp, P(v === cGo ? 'へ' : 'に'), v.nai + 'なければなりません');
        out.push({
          jp,
          particles,
          ro: `${timeRo(t)}${p.ro} wa ${pl.ro} ${v === cGo ? 'e' : 'ni'} ${v.naiRo}nakereba narimasen`,
          en: `${cap(p.en)} must ${v === cGo ? 'go to school' : 'go home'}${trailing(t.en.toLowerCase())}`,
          id: `${idSubject(t, p)} harus ${idVerb}`,
          gloss: { [v.nai + 'なければなりません']: [`must ${v === cGo ? 'go' : 'go home'}`, `harus ${v === cGo ? 'pergi' : 'pulang'}`] },
        });
      }
    }
  }
  templates.push(['N4 obligation: [person] は [object] を [verb]なければなりません', out, { jlpt: 'N4', pattern: 'verb' }]);
}

// N4-7. 〜たり〜たりします (e.g. しゅうまつは本を読んだりテレビを見たりします)
{
  const out = [];
  const activities = [[hon, cRead], [terebi, cWatch], [ongaku, cListen], [tegami, cWrite], [eiga, cWatch], [sushi, cMake], [nihongoObj, cStudy], [coffee, cDrink]];
  const times = [
    { jp: 'しゅうまつ', ro: 'shuumatsu', en: 'On weekends', id: 'Saat akhir pekan', past: false },
    { jp: '日曜日', ro: 'nichiyoubi', en: 'On Sundays', id: 'Setiap hari Minggu', past: false },
    { jp: 'きのう', ro: 'kinou', en: 'Yesterday', id: 'Kemarin', past: true },
  ];
  for (const t of times) {
    for (const [a, va] of activities) {
      for (const [b, vb] of activities) {
        if (a === b || va === vb) continue;
        const { jp, particles } = seg(t.jp, P('は'), a.jp, P('を'), va.ta + 'り', b.jp, P('を'), vb.ta + 'り', t.past ? 'しました' : 'します');
        out.push({
          jp,
          particles,
          ro: `${t.ro} wa ${a.ro} wo ${va.taRo}ri ${b.ro} wo ${vb.taRo}ri ${t.past ? 'shimashita' : 'shimasu'}`,
          en: `${t.en}, I ${t.past ? 'did' : 'do'} things like ${va.enIng} ${a.en} and ${vb.enIng} ${b.en}`,
          id: `${t.id}, saya ${va.id} ${a.id}, ${vb.id} ${b.id}, dan lain-lain`,
          gloss: {
            [va.ta + 'り']: [`(things like) ${va.enIng}`, `(antara lain) ${va.id}`],
            [vb.ta + 'り']: [`(things like) ${vb.enIng}`, `(antara lain) ${vb.id}`],
          },
        });
      }
    }
  }
  templates.push(['N4 listing actions: [time] は [A]たり [B]たりします', out, { jlpt: 'N4', pattern: 'verb' }]);
}

// N4-8. 〜と思います (e.g. あしたは雨だと思います)
{
  const out = [];
  const weather = [
    { jp: '雨', ro: 'ame', en: 'it will rain', id: 'akan hujan' },
    { jp: 'はれ', ro: 'hare', en: 'it will be sunny', id: 'akan cerah' },
    { jp: 'くもり', ro: 'kumori', en: 'it will be cloudy', id: 'akan berawan' },
    { jp: 'ゆき', ro: 'yuki', en: 'it will snow', id: 'akan turun salju' },
  ];
  for (const t of [ashita, raishuu]) {
    for (const w of weather) {
      const { jp, particles } = seg(t.jp, P('は'), w.jp, 'だ', P('と'), 'おもいます');
      out.push({
        jp,
        particles,
        ro: `${t.ro} wa ${w.ro} da to omoimasu`,
        en: `I think ${w.en} ${t.en.toLowerCase()}`,
        id: `Saya pikir ${t.id.toLowerCase()} ${w.id}`,
        gloss: { 'だ': ['is (plain form)', 'adalah (bentuk biasa)'], 'おもいます': ['think', 'pikir'] },
      });
    }
  }
  const opinions = [
    [obj('この本', 'kono hon', 'this book', 'buku ini'), [takai, yasui, atarashii, furui]],
    [obj('あの車', 'ano kuruma', 'that car', 'mobil itu'), [takai, yasui, atarashii, ookii]],
    [obj('日本語', 'nihongo', 'Japanese', 'bahasa Jepang'), [adj('むずかしい', 'muzukashii', 'difficult', 'sulit'), adj('おもしろい', 'omoshiroi', 'interesting', 'menarik')]],
    [obj('かんじ', 'kanji', 'kanji', 'kanji'), [adj('むずかしい', 'muzukashii', 'difficult', 'sulit'), adj('おもしろい', 'omoshiroi', 'interesting', 'menarik')]],
    [obj('この川', 'kono kawa', 'this river', 'sungai ini'), [nagai, ookii]],
  ];
  for (const [item, adjs] of opinions) {
    for (const a of adjs) {
      const { jp, particles } = seg(item.jp, P('は'), a.jp, P('と'), 'おもいます');
      out.push({
        jp,
        particles,
        ro: `${item.ro} wa ${a.ro} to omoimasu`,
        en: `I think ${item.en} is ${a.en}`,
        id: `Saya pikir ${item.id} ${a.id}`,
        gloss: {
          'おもいます': ['think', 'pikir'],
          'むずかしい': ['difficult', 'sulit'],
          'おもしろい': ['interesting', 'menarik'],
        },
      });
    }
  }
  templates.push(['N4 opinion: [topic] は [opinion] と思います', out, { jlpt: 'N4', pattern: 'verb' }]);
}

// ---------- IT and workplace templates ----------
// Sentences for people heading to an IT company: requests at work, what the
// team is doing, schedules and deadlines, career wishes and interview
// answers. They use the IT words of kanaCharacters.js (tag "it"), and are
// pushed with topic "it" so the menu's IT topic can offer only them.

// People at work: en / id at the start of a sentence, idLower after a time word
const itPerson = (jp, ro, en, id, idLower, be) => ({ jp, ro, en, id, idLower, be, third: be === 'is' });
const itPeople = [
  itPerson('わたし', 'watashi', 'I', 'Saya', 'saya', 'am'),
  itPerson('エンジニア', 'enjinia', 'the engineer', 'Engineer', 'engineer', 'is'),
  itPerson('プログラマー', 'puroguramaa', 'the programmer', 'Programmer', 'programmer', 'is'),
  itPerson('デザイナー', 'dezainaa', 'the designer', 'Desainer', 'desainer', 'is'),
  itPerson('マネージャー', 'maneejaa', 'the manager', 'Manajer', 'manajer', 'is'),
  itPerson('じょうし', 'joushi', 'my boss', 'Atasan saya', 'atasan saya', 'is'),
  itPerson('どうりょう', 'douryou', 'my colleague', 'Rekan kerja saya', 'rekan kerja saya', 'is'),
];

// する verbs of IT work: [noun]します / してください / しています / しました
const itVerb = (jp, ro, en, enIng, enPast, idCmd, id) => ({ jp, ro, en, enIng, enPast, idCmd, id });
const itVerbs = {
  review: itVerb('レビュー', 'rebyuu', 'review', 'reviewing', 'reviewed', 'tinjau', 'meninjau'),
  save: itVerb('ほぞん', 'hozon', 'save', 'saving', 'saved', 'simpan', 'menyimpan'),
  backup: itVerb('バックアップ', 'bakkuappu', 'back up', 'backing up', 'backed up', 'cadangkan', 'mencadangkan'),
  install: itVerb('インストール', 'insutooru', 'install', 'installing', 'installed', 'instal', 'menginstal'),
  check: itVerb('かくにん', 'kakunin', 'check', 'checking', 'checked', 'periksa', 'memeriksa'),
  fix: itVerb('しゅうせい', 'shuusei', 'fix', 'fixing', 'fixed', 'perbaiki', 'memperbaiki'),
  test: itVerb('テスト', 'tesuto', 'test', 'testing', 'tested', 'uji', 'menguji'),
  update: itVerb('アップデート', 'appudeeto', 'update', 'updating', 'updated', 'perbarui', 'memperbarui'),
  delete: itVerb('さくじょ', 'sakujo', 'delete', 'deleting', 'deleted', 'hapus', 'menghapus'),
  upload: itVerb('アップロード', 'appuroodo', 'upload', 'uploading', 'uploaded', 'unggah', 'mengunggah'),
  download: itVerb('ダウンロード', 'daunroodo', 'download', 'downloading', 'downloaded', 'unduh', 'mengunduh'),
  report: itVerb('ほうこく', 'houkoku', 'report', 'reporting', 'reported', 'laporkan', 'melaporkan'),
  release: itVerb('リリース', 'ririisu', 'release', 'releasing', 'released', 'rilis', 'merilis'),
  debug: itVerb('デバッグ', 'debaggu', 'debug', 'debugging', 'debugged', 'debug', 'men-debug'),
};

// What the work is done on, and what can be done to it
const itThing = (jp, ro, en, id) => ({ jp, ro, en, id });
const itWork = [
  [itThing('コード', 'koodo', 'the code', 'kode'), ['review', 'test', 'debug', 'fix']],
  [itThing('ファイル', 'fairu', 'the file', 'berkas'), ['save', 'upload', 'download', 'delete', 'backup']],
  [itThing('データ', 'deeta', 'the data', 'data'), ['backup', 'delete', 'save', 'check']],
  [itThing('アプリ', 'apuri', 'the app', 'aplikasi'), ['install', 'update', 'test', 'release']],
  [itThing('パスワード', 'pasuwaado', 'the password', 'kata sandi'), ['check']],
  [itThing('バグ', 'bagu', 'the bug', 'bug'), ['fix', 'report']],
  [itThing('システム', 'shisutemu', 'the system', 'sistem'), ['test', 'update']],
  [itThing('しようしょ', 'shiyousho', 'the specification', 'spesifikasi'), ['check', 'review']],
  [itThing('ソフトウェア', 'sofutowea', 'the software', 'perangkat lunak'), ['install', 'update']],
  [itThing('メール', 'meeru', 'the email', 'surel'), ['check']],
  [itThing('スケジュール', 'sukejuuru', 'the schedule', 'jadwal'), ['check']],
  [itThing('エラー', 'eraa', 'the error', 'error'), ['report', 'check']],
  [itThing('サーバー', 'saabaa', 'the server', 'server'), ['update', 'backup']],
  [itThing('データベース', 'deetabeesu', 'the database', 'basis data'), ['backup', 'update']],
].flatMap(([thing, verbs]) => verbs.map(verbKey => [thing, itVerbs[verbKey]]));

const suruGloss = {
  // "test" in both senses (the words list has the school one, ujian)
  'テスト': ['test', 'tes / pengujian'],
  'して': ['do (te-form)', 'melakukan (bentuk -te)'],
  'ください': ['please (do)', 'tolong'],
  'しています': ['is doing', 'sedang melakukan'],
  'しなければなりません': ['must do', 'harus melakukan'],
};

// IT-1. Requests at work: [thing] を [verb]してください (e.g. コードをレビューしてください)
{
  const out = itWork.map(([thing, v]) => {
    const { jp, particles } = seg(thing.jp, P('を'), v.jp + 'してください');
    return {
      jp,
      particles,
      ro: `${thing.ro} wo ${v.ro} shite kudasai`,
      en: `Please ${v.en} ${thing.en}`,
      id: `Tolong ${v.idCmd} ${thing.id}`,
      gloss: suruGloss,
    };
  });
  templates.push(['IT request: [thing] を [verb]してください', out, { jlpt: 'N5', pattern: 'verb', topic: 'it' }]);
}

// IT-2. What the team is doing: [person] は 今、[thing] を [verb]しています
{
  const out = [];
  for (const p of itPeople) {
    for (const [thing, v] of itWork) {
      const { jp, particles } = seg(p.jp, P('は'), '今、', thing.jp, P('を'), v.jp + 'しています');
      out.push({
        jp,
        particles,
        ro: `${p.ro} wa ima ${thing.ro} wo ${v.ro} shite imasu`,
        en: `${cap(p.en)} ${p.be} ${v.enIng} ${thing.en} now`,
        id: `${p.id} sedang ${v.id} ${thing.id} sekarang`,
        gloss: suruGloss,
      });
    }
  }
  templates.push(['IT progress: [person] は 今、[thing] を [verb]しています', out, { jlpt: 'N5', pattern: 'verb', topic: 'it' }]);
}

// IT-3. What was done: [time]、[person] は [thing] を [verb]しました
{
  const out = [];
  for (const t of [kinou, senshuu, kyou]) {
    for (const p of itPeople) {
      for (const [thing, v] of itWork) {
        const { jp, particles } = seg(timeComma(t), p.jp, P('は'), thing.jp, P('を'), v.jp + 'しました');
        out.push({
          jp,
          particles,
          ro: `${timeRo(t)}${p.ro} wa ${thing.ro} wo ${v.ro} shimashita`,
          en: `${cap(p.en)} ${v.enPast} ${thing.en} ${t.en.toLowerCase()}`,
          id: `${t.id} ${p.idLower} ${v.id} ${thing.id}`,
          gloss: suruGloss,
        });
      }
    }
  }
  templates.push(['IT done: [time]、[person] は [thing] を [verb]しました', out, { jlpt: 'N5', pattern: 'verb', topic: 'it' }]);
}

// IT-4. What has to be done: [time]、わたしは [thing] を [verb]しなければなりません
{
  const out = [];
  for (const t of [noTime, kyou, ashita]) {
    for (const [thing, v] of itWork) {
      const { jp, particles } = seg(timeComma(t), 'わたし', P('は'), thing.jp, P('を'), v.jp + 'しなければなりません');
      out.push({
        jp,
        particles,
        ro: `${timeRo(t)}watashi wa ${thing.ro} wo ${v.ro} shinakereba narimasen`,
        en: `I must ${v.en} ${thing.en}${trailing(t.en.toLowerCase())}`,
        id: `${t.id ? t.id + ' saya' : 'Saya'} harus ${v.id} ${thing.id}`,
        gloss: suruGloss,
      });
    }
  }
  templates.push(['IT obligation: わたしは [thing] を [verb]しなければなりません', out, { jlpt: 'N4', pattern: 'verb', topic: 'it' }]);
}

// IT-5. The schedule: [day] に [event] が あります (e.g. 月曜日にミーティングがあります)
{
  const events = [
    itThing('ミーティング', 'miitingu', 'a meeting', 'rapat'),
    itThing('かいぎ', 'kaigi', 'a meeting', 'rapat'),
    itThing('めんせつ', 'mensetsu', 'a job interview', 'wawancara kerja'),
    itThing('テスト', 'tesuto', 'a test', 'tes'),
    itThing('リリース', 'ririisu', 'a release', 'rilis'),
    itThing('レビュー', 'rebyuu', 'a review', 'review'),
  ];
  const workDays = days.filter(day => !/^[土日]/.test(day.jp));
  const out = [];
  for (const event of events) {
    for (const day of workDays) {
      const { jp, particles } = seg(day.jp, P('に'), event.jp, P('が'), 'あります');
      out.push({
        jp,
        particles,
        ro: `${day.ro} ni ${event.ro} ga arimasu`,
        en: `There is ${event.en} on ${day.en}`,
        id: `Hari ${day.id} ada ${event.id}`,
      });
    }
    for (const hour of hours.filter(item => /^[一二三四五六七八九十]+時$/.test(item.jp)).slice(0, 10)) {
      const { jp, particles } = seg('あした、', hour.jp, P('に'), event.jp, P('が'), 'あります');
      out.push({
        jp,
        particles,
        ro: `ashita ${hour.ro} ni ${event.ro} ga arimasu`,
        en: `There is ${event.en} at ${hour.en} tomorrow`,
        id: `Besok ${hour.id} ada ${event.id}`,
      });
    }
  }
  templates.push(['IT schedule: [day] に [event] が あります', out, { jlpt: 'N5', pattern: 'exist', topic: 'it' }]);
}

// IT-6. Deadlines: [thing] は [when] です (e.g. しめきりはあしたです)
{
  const subjects = [
    itThing('しめきり', 'shimekiri', 'The deadline', 'Tenggat waktunya'),
    itThing('リリース', 'ririisu', 'The release', 'Rilisnya'),
    itThing('ミーティング', 'miitingu', 'The meeting', 'Rapatnya'),
    itThing('めんせつ', 'mensetsu', 'The job interview', 'Wawancaranya'),
  ];
  const whens = [
    ...days.filter(day => !/^[土日]/.test(day.jp)).map(day => ({ jp: day.jp, ro: day.ro, en: `on ${day.en}`, id: `hari ${day.id}` })),
    { jp: 'あした', ro: 'ashita', en: 'tomorrow', id: 'besok' },
    { jp: '来週', ro: 'raishuu', en: 'next week', id: 'minggu depan' },
  ];
  const out = [];
  for (const subject of subjects) {
    for (const when of whens) {
      const { jp, particles } = seg(subject.jp, P('は'), when.jp, 'です');
      out.push({
        jp,
        particles,
        ro: `${subject.ro} wa ${when.ro} desu`,
        en: `${subject.en} is ${when.en}`,
        id: `${subject.id} ${when.id}`,
      });
    }
  }
  templates.push(['IT deadline: [thing] は [when] です', out, { jlpt: 'N5', pattern: 'desu', topic: 'it' }]);
}

// IT-7. Interview answers: わたしは [role] です / [place] で はたらいています
{
  const roles = [
    itThing('エンジニア', 'enjinia', 'an engineer', 'engineer'),
    itThing('プログラマー', 'puroguramaa', 'a programmer', 'programmer'),
    itThing('デザイナー', 'dezainaa', 'a designer', 'desainer'),
    itThing('マネージャー', 'maneejaa', 'a manager', 'manajer'),
  ];
  const out = roles.map(role => {
    const { jp, particles } = seg('わたし', P('は'), role.jp, 'です');
    return {
      jp,
      particles,
      ro: `watashi wa ${role.ro} desu`,
      en: `I am ${role.en}`,
      id: `Saya seorang ${role.id}`,
    };
  });
  for (const place of [
    itThing('かいしゃ', 'kaisha', 'at a company', 'di perusahaan'),
    itThing('オフィス', 'ofisu', 'at the office', 'di kantor'),
    itThing('うち', 'uchi', 'from home', 'dari rumah'),
  ]) {
    const { jp, particles } = seg('わたし', P('は'), place.jp, P('で'), 'はたらいています');
    out.push({
      jp,
      particles,
      ro: `watashi wa ${place.ro} de hataraite imasu`,
      en: `I work ${place.en}`,
      id: `Saya bekerja ${place.id}`,
      gloss: { 'はたらいています': ['work, am working', 'bekerja'] },
    });
  }
  templates.push(['IT interview: わたしは [role] です', out, { jlpt: 'N5', pattern: 'desu', topic: 'it' }]);
}

// IT-8. Career wishes: わたしは [role] に なりたいです / [place] で はたらきたいです
{
  const roles = [
    itThing('エンジニア', 'enjinia', 'an engineer', 'engineer'),
    itThing('プログラマー', 'puroguramaa', 'a programmer', 'programmer'),
    itThing('デザイナー', 'dezainaa', 'a designer', 'desainer'),
    itThing('マネージャー', 'maneejaa', 'a manager', 'manajer'),
    itThing('リーダー', 'riidaa', 'a leader', 'pemimpin'),
  ];
  const out = roles.map(role => {
    const { jp, particles } = seg('わたし', P('は'), role.jp, P('に'), 'なりたいです');
    return {
      jp,
      particles,
      ro: `watashi wa ${role.ro} ni naritai desu`,
      en: `I want to become ${role.en}`,
      id: `Saya ingin menjadi ${role.id}`,
      gloss: { 'なりたい': ['want to become', 'ingin menjadi'] },
    };
  });
  for (const place of [
    { parts: ['日本'], ro: 'nihon', en: 'in Japan', id: 'di Jepang' },
    { parts: ['日本', P('の'), 'かいしゃ'], ro: 'nihon no kaisha', en: 'at a Japanese company', id: 'di perusahaan Jepang' },
    { parts: ['オフィス'], ro: 'ofisu', en: 'at an office', id: 'di kantor' },
  ]) {
    const { jp, particles } = seg('わたし', P('は'), ...place.parts, P('で'), 'はたらきたいです');
    out.push({
      jp,
      particles,
      ro: `watashi wa ${place.ro} de hatarakitai desu`,
      en: `I want to work ${place.en}`,
      id: `Saya ingin bekerja ${place.id}`,
      gloss: { 'はたらきたい': ['want to work', 'ingin bekerja'] },
    });
  }
  templates.push(['IT career: わたしは [role] に なりたいです', out, { jlpt: 'N5', pattern: 'verb', topic: 'it' }]);
}

// IT-9. Experience: わたしは [skill] を べんきょうしたことがあります
{
  const skills = [
    itThing('プログラミング', 'puroguramingu', 'programming', 'pemrograman'),
    itThing('データベース', 'deetabeesu', 'databases', 'basis data'),
    itThing('セキュリティ', 'sekyuriti', 'security', 'keamanan'),
    itThing('ネットワーク', 'nettowaaku', 'networks', 'jaringan'),
    itThing('デザイン', 'dezain', 'design', 'desain'),
    itThing('アルゴリズム', 'arugorizumu', 'algorithms', 'algoritma'),
  ];
  const out = skills.map(skill => {
    const { jp, particles } = seg('わたし', P('は'), skill.jp, P('を'), 'べんきょうした', 'こと', P('が'), 'あります');
    return {
      jp,
      particles,
      ro: `watashi wa ${skill.ro} wo benkyou shita koto ga arimasu`,
      en: `I have studied ${skill.en} before`,
      id: `Saya pernah belajar ${skill.id}`,
      gloss: {
        'べんきょうした': ['studied', 'belajar (lampau)'],
        'こと': ['thing / experience', 'hal / pengalaman'],
      },
    };
  });
  templates.push(['IT experience: わたしは [skill] を べんきょうしたことがあります', out, { jlpt: 'N4', pattern: 'verb', topic: 'it' }]);
}

// IT-10. Skills: わたしは [thing] を [verb]ことができます / できません
{
  const abilities = [
    [itThing('コード', 'koodo', 'code', 'kode'), '書く', 'kaku', 'write', 'menulis'],
    [itThing('アプリ', 'apuri', 'apps', 'aplikasi'), 'つくる', 'tsukuru', 'make', 'membuat'],
    [itThing('ウェブサイト', 'webusaito', 'websites', 'situs web'), 'つくる', 'tsukuru', 'make', 'membuat'],
    [itThing('データベース', 'deetabeesu', 'databases', 'basis data'), 'つくる', 'tsukuru', 'build', 'membuat'],
    [itThing('メール', 'meeru', 'emails', 'surel'), '書く', 'kaku', 'write', 'menulis'],
    [itThing('しようしょ', 'shiyousho', 'specifications', 'spesifikasi'), '読む', 'yomu', 'read', 'membaca'],
  ];
  const out = [];
  for (const [thing, verbJp, verbRo, verbEn, verbId] of abilities) {
    for (const can of [true, false]) {
      const { jp, particles } = seg('わたし', P('は'), thing.jp, P('を'), verbJp, 'こと', P('が'), can ? 'できます' : 'できません');
      out.push({
        jp,
        particles,
        ro: `watashi wa ${thing.ro} wo ${verbRo} koto ga ${can ? 'dekimasu' : 'dekimasen'}`,
        en: `I ${can ? 'can' : "can't"} ${verbEn} ${thing.en}`,
        id: `Saya ${can ? 'bisa' : 'tidak bisa'} ${verbId} ${thing.id}`,
        gloss: {
          [verbJp]: [`${verbEn} (dictionary form)`, `${verbId} (bentuk kamus)`],
          'こと': ['thing / experience', 'hal / pengalaman'],
          'できます': ['can, be able to', 'bisa'],
          'できません': ["can't", 'tidak bisa'],
        },
      });
    }
  }
  templates.push(['IT skills: わたしは [thing] を [verb]ことができます', out, { jlpt: 'N4', pattern: 'verb', topic: 'it' }]);
}

// ---------- Sampling ----------
// Deterministic shuffle so the output file is stable between runs
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (list, seed) => {
  const random = mulberry32(seed);
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Orders a template's candidates so that each next sentence repeats as few
// words of the ones before it as possible: without this, sentences that only
// differ by one word (その駅は小さいです / その車は小さいです) end up side by
// side. Ties keep the shuffled order, so the result stays deterministic.
const varied = (list) => {
  const remaining = [...list];
  const used = new Map();
  const repeats = (entry) => entry.ro.split(' ').reduce((total, word) => total + (used.get(word) || 0), 0);
  const ordered = [];
  while (remaining.length) {
    let bestIndex = 0;
    let bestRepeats = Infinity;
    remaining.forEach((entry, index) => {
      const count = repeats(entry);
      if (count < bestRepeats) {
        bestRepeats = count;
        bestIndex = index;
      }
    });
    const [entry] = remaining.splice(bestIndex, 1);
    entry.ro.split(' ').forEach(word => used.set(word, (used.get(word) || 0) + 1));
    ordered.push(entry);
  }
  return ordered;
};

// How many sentences to keep per template, to reach roughly 870 in total
// (~150 of them questions)
const quotas = {
  'この/その/あの + noun + は + adjective': 45,
  'weather': 4,
  '[person] は [place] へ 行きます / に 来ます': 60,
  '[person] は [object] を [verb]': 70,
  '[person] は [place] で [object] を [verb]': 70,
  '[place] に [thing] が あります': 12,
  '[place] に [person] が います': 15,
  '[thing] は [location] に あります': 10,
  '[person] は [thing] が すきです': 25,
  '[place] は どこですか': 6,
  '[person] は [language] を [verb]': 24,
  '[person] は [place] に います': 20,
  '[person] は [place] で 友だちに 会います': 15,
  '[person] は [place] で べんきょうします': 25,
  '[person] の [thing] は [adjective] です': 35,
  'days of the week': 15,
  '[person] は 毎日 [hour] に 学校へ 行きます': 15,
  '[person] は [place] で 休みます': 10,
  // Daily-life templates (word banks from kanaCharacters.js / kanjiUsage.js /
  // kanjiUsageMeanings.js / kanjiReadings.js)
  'daily routine: [person] は [time] に おきます / ねます': 24,
  'chores: [person] は [thing] を あらいます / つくります': 18,
  'commute: [person] は [vehicle] で [place] へ 行きます': 30,
  'meals: [person] は [place] で [food] を 食べます / 飲みます': 26,
  'ordering: [item] を おねがいします': 10,
  'schedule: [person] は [hour] から [hour] まで [place] で べんきょうします': 14,
  'likes: [person] は [thing] が すきです / きらいです': 20,
  'seasons and temperature': 9,
  'family size: [member] が [number] 人 います': 15,
  'prices: [item] は [price] 円 です': 15,
  'skills: [person] は [thing] が じょうずです': 10,
  'activities: [person] は [time] に [activity] を します': 18,
  'together: [person] は [companion] と いっしょに [place] へ 行きます': 12,
  'crowded: [place] は 人 が 多い / 少ない です': 10,
  'nearby: [place] の [side] に [thing] が あります': 13,
  // Question templates (か at the end): 150 questions in total that practice
  // the patterns above in their asking form
  'question: [demo] [person] は だれですか': 10,
  'question: [demo] は なんの [item] ですか': 8,
  'question: 今、[hour]ですか': 8,
  'question: [demo] [noun] は [adjective] ですか': 18,
  'question: [time] [person] は [object] を [verb]ますか': 25,
  'question: [person] は [place] へ 行きますか': 14,
  'question: [person] は [place] に いますか': 9,
  'question: [place] に [thing] が ありますか': 10,
  'question: [person] は [thing] が すきですか': 11,
  'question: [person] は [language] を [verb]ますか': 6,
  'question: [time] は [day] ですか': 9,
  'question: [person] は [place] で [object] を [verb]ますか': 11,
  'question: [person] は なんじに おきます / ねます か': 6,
  'question: いっしょに [place] へ 行きませんか': 5,
  // N5 / N4 grammar templates
  'N5 negative: [person] は [object] を [verb]ません / ませんでした': 30,
  'N5 want: わたしは [object] を [verb]たいです': 25,
  'N5 invite: いっしょに [object] を [verb]ましょう': 20,
  'N5 request: [object] を [verb]てください': 20,
  'N5 progressive: [person] は 今 [object] を [verb]ています': 25,
  'N5 adjective negative: [noun] は [adjective]くないです': 20,
  'N5 want something: わたしは [thing] が ほしいです': 12,
  'N5 comparison: [A] は [B] より [adjective] です': 14,
  'N4 permission: [object] を [verb]てもいいですか': 20,
  'N4 prohibition: [place] で [object] を [verb]てはいけません': 16,
  'N4 experience: [person] は [object] を [verb]たことがあります': 30,
  'N4 ability: [person] は [object] を [verb]ことができます': 24,
  'N4 plan: わたしは [object] を [verb]つもりです': 18,
  'N4 obligation: [person] は [object] を [verb]なければなりません': 24,
  'N4 listing actions: [time] は [A]たり [B]たりします': 20,
  'N4 opinion: [topic] は [opinion] と思います': 18,
  // IT and workplace templates (topic "it")
  'IT request: [thing] を [verb]してください': 25,
  'IT progress: [person] は 今、[thing] を [verb]しています': 30,
  'IT done: [time]、[person] は [thing] を [verb]しました': 30,
  'IT obligation: わたしは [thing] を [verb]しなければなりません': 20,
  'IT schedule: [day] に [event] が あります': 20,
  'IT deadline: [thing] は [when] です': 14,
  'IT interview: わたしは [role] です': 7,
  'IT career: わたしは [role] に なりたいです': 8,
  'IT experience: わたしは [skill] を べんきょうしたことがあります': 6,
  'IT skills: わたしは [thing] を [verb]ことができます': 12,
};

// ---------- Validation + assembly ----------
const curatedSource = read('src/sentences.js');
const seen = new Set(
  [...curatedSource.matchAll(/"jp_character":\s*"([^"]+)"/g)].map(match => match[1])
);
const problems = [];
const entries = [];
const report = [];

// The dictionary itself must be well formed: one kana-only reading per kanji.
for (const [run, readings] of Object.entries(furiganaByKanjiRun)) {
  if (readings.length !== [...run].length || !readings.every(reading => KANA_READING.test(reading))) {
    problems.push(`furigana dictionary entry "${run}" must have one kana reading per kanji`);
  }
}

// The hand-written curated sentences carry their own "furigana" fields; they
// must agree with the readings the dictionary derives for the same sentence.
{
  const curatedBody = curatedSource.slice(curatedSource.indexOf('export const sentences = ['));
  for (const block of curatedBody.split('\n  {').slice(1)) {
    const jp = /"jp_character":\s*"([^"]+)"/.exec(block)?.[1];
    if (!jp) continue;
    const writtenMatch = /"furigana":\s*(\{[^}]*\})/.exec(block);
    const written = writtenMatch ? JSON.parse(writtenMatch[1]) : null;
    const computed = computeFurigana(jp);
    if (computed === null) {
      problems.push(`[curated] kanji word without furigana readings in ${jp}`);
      continue;
    }
    if (Object.keys(computed).length === 0) {
      if (written) problems.push(`[curated] kana-only sentence ${jp} must not have a furigana field`);
    } else if (!written) {
      problems.push(`[curated] ${jp} is missing its furigana field`);
    } else if (JSON.stringify(written) !== JSON.stringify(computed)) {
      problems.push(`[curated] furigana mismatch in ${jp}: expected ${JSON.stringify(computed)}`);
    }
  }
}

// Meanings of the conjugated words of the kept sentences, for the word
// breakdown (written to src/generatedGlossary.js)
const generatedGlossary = {};

for (const [name, candidates, meta = {}] of templates) {
  const quota = quotas[name] ?? 10;
  const picked = varied(shuffle(candidates, name.length * 7919 + candidates.length));
  let taken = 0;
  for (const entry of picked) {
    if (taken >= quota) break;
    if (seen.has(entry.jp)) continue;
    const badCharacter = [...entry.jp].find(ch => !isAllowedCharacter(ch));
    if (badCharacter) {
      problems.push(`[${name}] untaught character "${badCharacter}" in ${entry.jp}`);
      continue;
    }
    if (!/^[a-z ]+$/.test(entry.ro)) {
      problems.push(`[${name}] bad romanji "${entry.ro}" in ${entry.jp}`);
      continue;
    }
    if (!entry.en || !entry.id || !entry.jp) {
      problems.push(`[${name}] missing translation in ${entry.jp}`);
      continue;
    }
    const badParticleIndex = (entry.particles || []).find(index => index < 0 || index >= entry.jp.length);
    if (badParticleIndex !== undefined) {
      problems.push(`[${name}] particle index out of range in ${entry.jp}`);
      continue;
    }
    const furigana = computeFurigana(entry.jp);
    if (furigana === null) {
      problems.push(`[${name}] kanji word without furigana readings in ${entry.jp}`);
      continue;
    }
    // wo can always be typed as "o" as well
    const romanji = [entry.ro];
    if (/(^| )wo( |$)/.test(entry.ro)) {
      romanji.push(entry.ro.replace(/(^| )wo( |$)/g, '$1o$2'));
    }
    seen.add(entry.jp);
    entries.push({
      jp_character: entry.jp,
      particles: entry.particles || [],
      romanji,
      // Small kana readings above the kanji, shown when the player asks for
      // help (character index of the kanji -> its reading). Kana-only
      // sentences carry no furigana at all.
      ...(Object.keys(furigana).length ? { furigana } : {}),
      meaning: entry.en,
      meaning_id: entry.id,
      // JLPT level and grammar pattern, for templates that set them (the
      // others are N5, and their pattern is read from how they end)
      ...(meta.jlpt ? { jlpt: meta.jlpt } : {}),
      ...(meta.pattern ? { pattern: meta.pattern } : {}),
      // Topic of the IT templates, for the menu's IT topic
      ...(meta.topic ? { topic: meta.topic } : {}),
    });
    Object.assign(generatedGlossary, entry.gloss || {});
    taken++;
  }
  report.push(`${name}: ${taken}/${candidates.length} (quota ${quota})`);
}

report.forEach(line => console.log(line));
console.log(`generated: ${entries.length} (+ ${seen.size - entries.length} curated) = ${seen.size} total`);

if (problems.length) {
  console.log('\nPROBLEMS:');
  problems.forEach(problem => console.log(' -', problem));
  process.exitCode = 1;
}

// ---------- Readability check for the filter unit test ----------
// What the これは水です groups can read (for information: the tests pass the
// sentence they need with the navigation, see AGENT.md)
{
  const groupOf = {};
  for (const group of [...Object.values(hiraganaData), ...Object.values(katakanaData)]) {
    for (const character of Object.values(group.characters)) {
      if (!(character.jp_character in groupOf)) groupOf[character.jp_character] = group.title;
    }
  }
  // Kanji groups as kanaCharacters.js makes them: each theme in groups of 10
  for (const category of n5KanjiData.categories) {
    category.characters.forEach((character, index) => {
      if (!(character in groupOf)) groupOf[character] = `${category.title} - ${Math.floor(index / 10) + 1}`;
    });
  }
  const selection = new Set(['か', 'ら', 'は', 'だ', 'さ', groupOf['水']]);
  const readable = entries
    .filter(entry => [...entry.jp_character].every(ch => !groupOf[ch] || selection.has(groupOf[ch])))
    .map(entry => entry.jp_character);
  console.log('\ngenerated sentences readable with the filter-test selection:', JSON.stringify(readable));
}

// ---------- Write file ----------
const chunks = entries.length
  ? entries.map(entry => '  ' + JSON.stringify(entry, null, 2).split('\n').join('\n  ')).join(',\n')
  : '';
const output = `/* AUTO-GENERATED by scripts/generateSentences.mjs — do not edit by hand.
 * Beginner sentences composed from curated N5 word banks and grammar
 * templates. Every sentence only uses kana and kanji taught in
 * kanaCharacters.js, and each one carries its romaji (word-spaced) plus
 * English and Indonesian meanings. "particles" lists the character indices
 * of the particles (は, を, に...) so the game can show them in a different
 * color. "furigana" maps the character index of every kanji to its kana
 * reading, shown in small print above the kanji when the player asks for
 * help; sentences without kanji have no furigana field.
 *
 * The "sentences" practice mode only offers the sentences the player can
 * read with the groups selected in the menu (see getReadableSentences in
 * sentences.js). Run \`node scripts/generateSentences.mjs\` to regenerate.
 */
export const generatedSentences = [
${chunks},
];
`;
fs.writeFileSync(path.join(root, 'src/generatedSentences.js'), output);

const glossaryOutput = `/* AUTO-GENERATED by scripts/generateSentences.mjs — do not edit by hand.
 * Meanings of the conjugated words of the generated sentences (飲みません,
 * 食べています...), shown in the word breakdown after a sentence is typed
 * correctly. Each entry is [English, Indonesian]; see sentenceGlossary.js.
 */
export const generatedGlossary = ${JSON.stringify(
  Object.fromEntries(Object.entries(generatedGlossary).sort(([a], [b]) => a.localeCompare(b, 'ja'))),
  null,
  2
)};
`;
fs.writeFileSync(path.join(root, 'src/generatedGlossary.js'), glossaryOutput);
console.log('\nwrote src/generatedSentences.js');
