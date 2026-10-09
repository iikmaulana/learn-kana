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
const charactersSource = read('src/kanaCharacters.js');
const allowedKanji = new Set(
  [...charactersSource.matchAll(/"jp_character":\s*"([^"]+)"/g)]
    .map(match => match[1])
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

// How many sentences to keep per template, to reach ~500 in total
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
};

// ---------- Validation + assembly ----------
const curatedSource = read('src/sentences.js');
const seen = new Set(
  [...curatedSource.matchAll(/"jp_character":\s*"([^"]+)"/g)].map(match => match[1])
);
const problems = [];
const entries = [];
const report = [];

for (const [name, candidates] of templates) {
  const quota = quotas[name] ?? 10;
  const picked = shuffle(candidates, name.length * 7919 + candidates.length);
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
      meaning: entry.en,
      meaning_id: entry.id,
    });
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
// The longPractice test expects exactly one sentence for this selection
{
  const groupOf = {};
  const lines = charactersSource.split('\n');
  for (const [a, b] of [[73, 692], [692, 1310], [10886, lines.length]]) {
    const text = lines.slice(a - 1, b - 1).join('\n');
    for (const g of [...text.matchAll(/"title":\s*"([^"]+)"[\s\S]*?(?="title":|$)/g)]) {
      for (const c of [...g[0].matchAll(/"jp_character":\s*"([^"]+)"/g)]) {
        if (!(c[1] in groupOf)) groupOf[c[1]] = g[1];
      }
    }
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
 * color.
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
console.log('\nwrote src/generatedSentences.js');
