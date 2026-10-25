/*
 * Generates src/wordSentences.js: 295 kana-only sentences for the "sentences"
 * (long typing) practice, each built from vocabulary that lives in
 * src/data/words.json (the "words" mode).
 *
 * words.json nouns are paired with grammar templates that fit their category,
 * so the result reads naturally:
 *   food     -> X{を}たべます / X{が}おいしいです
 *   animal   -> X{が}かわいいです / place{に}X{が}います
 *   abstract -> X{が}すきです / X{が}むずかしいです
 *   item     -> X{が}おおきいです / X{が}ほしいです
 * Every candidate is checked against the real matching and glossary modules, so
 * a sentence only makes the file when it:
 *   - is kana only (no kanji, so it needs no furigana and never introduces an
 *     untaught character);
 *   - lines its romaji up with the kana (alignWords) and accepts its own romaji
 *     and kana reading when typed (createSentenceMatcher);
 *   - breaks down into words that all have a meaning in English and Indonesian
 *     (the words.json vocabulary and the fixed grammar endings are glossed);
 *   - is not already in the sentence pool.
 *
 * Run with:  npx vite-node scripts/generateWordSentences.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { s } from '../src/dailySentences.js';
import { glossOf, sentenceBreakdown } from '../src/sentenceGlossary.js';
import { alignWords, createSentenceMatcher, kanaToRomaji } from '../src/sentenceMatching.js';
import { kanaCharacters } from '../src/kanaCharacters.js';
import { sentences as poolSentences } from '../src/sentences.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = 295;

// ---------- Vocabulary from words.json (kana only: no kanji) ----------
const isKanaOnly = (text) => ![...text].some((character) => /[㐀-䶿一-鿿〻々]/u.test(character));
const words = Object.values(kanaCharacters.words).filter(
  (word) => word.jp_character && isKanaOnly(word.jp_character)
);
const hasTag = (word, ...tags) => (word.tags || []).some((tag) => tags.includes(tag));
const meaningIs = (word, pattern) => pattern.test(word.meaning || '');

// A sentence subject: skip verbs / adjectives / adverbs and the grammar words
// (pronouns, demonstratives, question words, numbers, greetings) so every noun
// is a real thing someone can like, want, eat or find somewhere.
const nouns = words.filter((word) => !hasTag(
  word, 'verbs', 'adjectives', 'adverbs', 'expressions', 'greetings', 'politeness',
  'question_words', 'demonstratives', 'numbers', 'pronouns', 'distance'
));

// Category helpers drive which template a noun is allowed to use.
const isAnimate = (word) => hasTag(word, 'animals', 'pets', 'seafood');
const isPerson = (word) => hasTag(word, 'people', 'family') || meaningIs(word, /baby|child|kid|boy|girl|man|woman|teacher|student|friend|person/);
const isFood = (word) => hasTag(word, 'food', 'fruits', 'vegetables', 'sweets', 'meat', 'seafood', 'condiments');
// Drinkable is judged from the meaning, not the noisy "drinks" tag (which the
// data also puts on すいか watermelon and おおみず flood).
const isDrink = (word) => meaningIs(word, /coffee|\btea\b|juice|\bmilk\b|beer|sake|wine|soup|\bwater\b|\bdrink\b|soda|cola|smoothie|lemonade|cocoa/);
// A venue is a real place someone can be at (a building, a school, an outdoor
// spot), so it hosts the exist sentences and takes the place adjectives. The
// "home" tag is household items (a bed, a blanket), kept with the item group.
const isBuilding = (word) => hasTag(word, 'places', 'locations', 'buildings', 'school') || meaningIs(word, /park|beach|sea|ocean|river|mountain|station|library|hospital|office|store|shop|market|restaurant|hotel|airport|city|town|farm|field|garden|inn|school|classroom/);
const isItem = (word) => hasTag(word, 'items', 'clothing', 'accessories', 'furniture', 'technology', 'transportation', 'toys', 'tools', 'home');
const isActivity = (word) => hasTag(word, 'activities', 'hobbies', 'sports', 'music', 'art', 'martial_arts', 'entertainment', 'work', 'movement', 'languages') ||
  meaningIs(word, /study|sport|game|travel|music|dance|math|science|history|english|japanese|work|club/);
const isCute = (word) => isAnimate(word) || (isPerson(word) && meaningIs(word, /baby|child|kid|boy|girl/)) || hasTag(word, 'clothing', 'toys', 'accessories');

// ---------- Particles: braced in the template, read like the game ----------
const PARTICLE_ROMAJI = {
  'は': 'wa', 'を': 'wo', 'へ': 'e', 'が': 'ga', 'に': 'ni', 'で': 'de',
  'と': 'to', 'の': 'no', 'も': 'mo', 'から': 'kara', 'まで': 'made',
};

// Parts: [{ k, p? }]. Builds the braced template and its romaji: content words
// romanize through kanaToRomaji (the same reading the matcher uses), particles
// through their spoken form (は -> wa, を -> wo, へ -> e).
function makeSentence(parts, en, id) {
  const tmpl = parts.map((part) => (part.p ? `{${part.k}}` : part.k)).join('');
  const romaji = parts.map((part) => (part.p ? PARTICLE_ROMAJI[part.k] : kanaToRomaji(part.k))).join(' ');
  const sentence = s(tmpl, romaji, en, id);
  // Keep the braced template so the emitted file rebuilds the particle indices
  sentence._tmpl = tmpl;
  return sentence;
}

const clean = (text) => String(text || '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').replace(/^(a|an|the)\s+/i, '').trim();
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const gloss = (kana, lang) => clean(glossOf(kana, lang));
// A bare noun gloss reads better in a sentence with an article.
const nounEn = (kana) => `the ${gloss(kana, 'en')}`;

// ---------- Validation against the real modules ----------
const existingJp = new Set(poolSentences.map((sentence) => sentence.jp_character));
const seen = new Set();

function isValid(sentence) {
  const jp = sentence.jp_character;
  if (seen.has(jp) || existingJp.has(jp)) return false;
  if (![...jp].every((character) => isKanaOnly(character) || /[、。ー]/.test(character))) return false;
  if (!alignWords(sentence, sentence.romanji[0].split(' '))) return false;
  const check = createSentenceMatcher(sentence).check;
  if (!check(sentence.romanji[0]).correct) return false;
  // Typed with a Japanese keyboard: the kana reading of the whole sentence
  const kana = [...jp].map((character, index) => (sentence.furigana || {})[index] || character).join('').replace(/[、。]/g, '');
  if (!check(kana).correct) return false;
  // Every word of the breakdown needs a meaning in both languages
  for (const language of ['en', 'id']) {
    const breakdown = sentenceBreakdown(sentence, language);
    if (!breakdown.length || breakdown.some((word) => !word.meaning || !word.meaning.trim())) return false;
  }
  return true;
}

// Builds one sentence from parts + meanings and keeps it only when it passes.
function keep(list, parts, en, id) {
  const sentence = makeSentence(parts, en, id);
  if (isValid(sentence)) { seen.add(sentence.jp_character); list.push(sentence); }
}

// ---------- Sentence builders, one per grammar pattern ----------
// X{が}<adjective>{です}: The X is <adjective> (also used for the desire words
// すき / きらい / ほしい, which take が and read "I like / dislike / want X").
const adjectiveSentence = (list, noun, adjectiveKana) => keep(
  list, [{ k: noun.jp_character }, { k: 'が', p: true }, { k: adjectiveKana }, { k: 'です' }],
  cap(`The ${gloss(noun.jp_character, 'en')} is ${gloss(adjectiveKana, 'en')}`),
  cap(`${gloss(noun.jp_character, 'id')} ${gloss(adjectiveKana, 'id')}`),
);

// X{が}<desire>{です} reads "I like / dislike / want X", not "X is love".
const DESIRE = {
  'すき': ['like', 'suka'],
  'きらい': ['do not like', 'tidak suka'],
  'ほしい': ['want', 'ingin punya'],
};
const desireSentence = (list, noun, desireKana) => {
  const [enVerb, idVerb] = DESIRE[desireKana];
  keep(
    list,
    [{ k: noun.jp_character }, { k: 'が', p: true }, { k: desireKana }, { k: 'です' }],
    cap(`I ${enVerb} ${nounEn(noun.jp_character)}`),
    cap(`Saya ${idVerb} ${gloss(noun.jp_character, 'id')}`),
  );
};

// X{を}<verb>{ます}: I <verb> X.
const objectVerbSentence = (list, noun, verbKana, enVerb, idVerb) => keep(
  list, [{ k: noun.jp_character }, { k: 'を', p: true }, { k: verbKana }],
  cap(`I ${enVerb} ${nounEn(noun.jp_character)}`),
  cap(`Saya ${idVerb} ${gloss(noun.jp_character, 'id')}`),
);

// <place>{に}X{が}<exist>: There is X at the place.
const existSentence = (list, place, noun) => keep(
  list, [{ k: place.jp_character }, { k: 'に', p: true }, { k: noun.jp_character }, { k: 'が', p: true }, { k: isAnimate(noun) || isPerson(noun) ? 'います' : 'あります' }],
  cap(`There is ${nounEn(noun.jp_character)} at the ${gloss(place.jp_character, 'en')}`),
  cap(`Ada ${gloss(noun.jp_character, 'id')} di ${gloss(place.jp_character, 'id')}`),
);

// ---------- Fill each family, cycling nouns so patterns spread out ----------
const families = [];
const push = (name, sentences) => families.push({ name, sentences });

// Desire: every noun, three feelings taken in turn.
const likeList = []; const dislikeList = []; const wantList = [];
nouns.forEach((noun, i) => {
  const wantable = isItem(noun) || isFood(noun) || isCute(noun);
  if (i % 3 !== 1) desireSentence(likeList, noun, 'すき');
  if (i % 3 === 1) desireSentence(dislikeList, noun, 'きらい');
  if (wantable && i % 4 === 2) desireSentence(wantList, noun, 'ほしい');
});
push('like', likeList); push('dislike', dislikeList); push('want', wantList);

// Food / drink verbs + taste.
const eatList = []; const drinkList = []; const tasteList = [];
nouns.forEach((noun) => {
  if (isFood(noun) && !isDrink(noun)) objectVerbSentence(eatList, noun, 'たべます', 'eat', 'makan');
  if (isDrink(noun)) objectVerbSentence(drinkList, noun, 'のみます', 'drink', 'minum');
  if (isFood(noun) || isDrink(noun)) adjectiveSentence(tasteList, noun, 'おいしい');
});
push('eat', eatList); push('drink', drinkList); push('delicious', tasteList);

// Appearance, size, age and price, matched to the noun category.
const cuteList = []; const itemDescList = []; const placeDescList = []; const activityDescList = [];
const itemAdjs = ['おおきい', 'ちいさい', 'あたらしい', 'ふるい', 'たかい', 'やすい', 'きれい'];
const placeAdjs = ['ゆうめい', 'しずか', 'にぎやか', 'きれい', 'たかい'];
const activityAdjs = ['おもしろい', 'たのしい', 'むずかしい', 'たいへん', 'じょうず', 'へた'];
nouns.forEach((noun, i) => {
  if (isCute(noun)) adjectiveSentence(cuteList, noun, 'かわいい');
  if (isBuilding(noun)) adjectiveSentence(placeDescList, noun, placeAdjs[i % placeAdjs.length]);
  else if (isItem(noun)) adjectiveSentence(itemDescList, noun, itemAdjs[i % itemAdjs.length]);
  if (isActivity(noun)) adjectiveSentence(activityDescList, noun, activityAdjs[i % activityAdjs.length]);
});
push('cute', cuteList); push('place', placeDescList); push('item', itemDescList); push('activity', activityDescList);

// Read / watch / listen / play, chosen from what the noun means.
const readList = []; const watchList = []; const listenList = []; const playList = [];
nouns.forEach((noun) => {
  if (meaningIs(noun, /book|magazine|newspaper|letter|dictionary|manga|kanji|hiragana|katakana|comic/)) objectVerbSentence(readList, noun, 'よみます', 'read', 'membaca');
  if (meaningIs(noun, /movie|film|television|tv|show|video|picture|photograph|game/)) objectVerbSentence(watchList, noun, 'みます', 'watch', 'menonton');
  if (meaningIs(noun, /music|song|radio|piano|guitar|instrument|shamisen/)) objectVerbSentence(listenList, noun, 'ききます', 'listen to', 'mendengarkan');
  if (hasTag(noun, 'sports', 'martial_arts') || meaningIs(noun, /soccer|baseball|tennis|chess|badminton|basketball|volleyball|\bgame\b|swim|ski/)) objectVerbSentence(playList, noun, 'あそびます', 'play', 'bermain');
});
push('read', readList); push('watch', watchList); push('listen', listenList); push('play', playList);

// Existence: a place holds a concrete thing (or a person / animal).
const existAnimateList = []; const existThingList = [];
const places = nouns.filter(isBuilding);
const livingSubjects = nouns.filter((noun) => isAnimate(noun) || isPerson(noun));
const thingSubjects = nouns.filter((noun) => isItem(noun) || isFood(noun));
places.forEach((place, pi) => {
  if (livingSubjects.length) existSentence(existAnimateList, place, livingSubjects[pi % livingSubjects.length]);
  if (thingSubjects.length) existSentence(existThingList, place, thingSubjects[pi % thingSubjects.length]);
});
push('exist-living', existAnimateList); push('exist-thing', existThingList);

// Round-robin across the families so the file mixes patterns and topics.
const collected = [];
for (let index = 0; collected.length < TARGET; index++) {
  let addedThisPass = false;
  for (const family of families) {
    if (collected.length >= TARGET) break;
    const sentence = family.sentences[index];
    if (sentence) { collected.push(sentence); addedThisPass = true; }
  }
  if (!addedThisPass) break;
}

if (collected.length < TARGET) {
  console.error(`Only ${collected.length} valid sentences were produced (target ${TARGET}).`);
  process.exit(1);
}

// ---------- Write src/wordSentences.js ----------
const line = (sentence) => {
  const args = [sentence._tmpl, sentence.romanji[0], sentence.meaning, sentence.meaning_id]
    .map((value) => JSON.stringify(value));
  return `  s(${args.join(', ')}),`;
};

const header = `// 295 kana-only sentences for the "sentences" practice, each built from
// vocabulary in src/data/words.json (the "words" mode). Generated by
// scripts/generateWordSentences.mjs and checked against the real matching and
// glossary modules, so every one can be typed and broken down. Same rules as
// dailySentences.js (the s() helper is imported from there):
//  - kana only, no kanji, so a sentence is readable as soon as its kana groups
//    are selected and never introduces an untaught kanji;
//  - a pair of braces marks a particle, so its index is computed by s().

import { s } from './dailySentences.js';

export const wordSentences = [`;

const body = collected.map(line).join('\n');
fs.writeFileSync(path.join(root, 'src/wordSentences.js'), `${header}\n${body}\n];\n`);

console.log(`Wrote ${collected.length} sentences to src/wordSentences.js`);
