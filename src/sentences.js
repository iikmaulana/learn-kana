import { kanaCharacters } from './kanaCharacters.js';
import { generatedSentences } from './generatedSentences.js';
import { imperativeSentences, questionSentences, answerSentences } from './dailySentences.js';
import { toddlerSentences, elementarySentences, juniorHighSentences } from './kidsSentences.js';
import { wordSentences } from './wordSentences.js';
import { getSentenceOptions, sentenceInTopic } from './practiceOptions.js';
import { addIndonesianMeanings } from './i18n.js';

/* Sentence data for the "sentences" (long typing) practice: real, correct
 * beginner sentences that are typed as a single romaji answer.
 *
 * - "jp_character" is the full sentence shown on screen.
 * - "particles" lists the character indices of the particles (は, を,
 *   に...) so the game can show them in a different color.
 * - "furigana" maps the character index of every kanji to its kana reading,
 *   shown in small print above the kanji when the player asks for help.
 *   Kana-only sentences carry no furigana. The fields are verified against
 *   the dictionary in scripts/generateSentences.mjs.
 * - "romanji" holds the accepted answers, written with spaces between words
 *   for readability (spaces and hyphens are ignored when checking). Extra
 *   entries are alternative accepted spellings of the same sentence.
 * - "meaning" (English) and "meaning_id" (Indonesian) are shown once the
 *   sentence has been typed correctly.
 *
 * The kanji used here are limited to the ones taught in kanaCharacters.js,
 * so every sentence only uses characters the app has introduced. Particles
 * are written as they are pronounced: は = "wa", へ = "e", を = "wo" / "o".
 *
 * Only the sentences whose kana and kanji belong to the selected groups are
 * offered in the game (see getReadableSentences at the end of this file).
 */
export const sentences = [
  {
    "jp_character": "これは水です",
    "particles": [2],
    "furigana": {"3": "みず"},
    "romanji": ["kore wa mizu desu"],
    "meaning": "This is water",
    "meaning_id": "Ini air",
  },
  {
    "jp_character": "ここは駅です",
    "particles": [2],
    "furigana": {"3": "えき"},
    "romanji": ["koko wa eki desu"],
    "meaning": "This is the station",
    "meaning_id": "Di sini adalah stasiun",
  },
  {
    "jp_character": "あれは学校です",
    "particles": [2],
    "furigana": {"3": "がっ", "4": "こう"},
    "romanji": ["are wa gakkou desu"],
    "meaning": "That over there is a school",
    "meaning_id": "Itu sekolah di sana",
  },
  {
    "jp_character": "それはなんですか",
    "particles": [2, 7],
    "romanji": ["sore wa nan desu ka"],
    "meaning": "What is that?",
    "meaning_id": "Itu apa?",
  },
  {
    "jp_character": "わたしは学生です",
    "particles": [3],
    "furigana": {"4": "がく", "5": "せい"},
    "romanji": ["watashi wa gakusei desu"],
    "meaning": "I am a student",
    "meaning_id": "Saya seorang pelajar",
  },
  {
    "jp_character": "わたしは日本人です",
    "particles": [3],
    "furigana": {"4": "に", "5": "ほん", "6": "じん"},
    "romanji": ["watashi wa nihonjin desu"],
    "meaning": "I am Japanese",
    "meaning_id": "Saya orang Jepang",
  },
  {
    "jp_character": "あなたは先生です",
    "particles": [3],
    "furigana": {"4": "せん", "5": "せい"},
    "romanji": ["anata wa sensei desu"],
    "meaning": "You are a teacher",
    "meaning_id": "Anda seorang guru",
  },
  {
    "jp_character": "今日は雨です",
    "particles": [2],
    "furigana": {"0": "きょ", "1": "う", "3": "あめ"},
    "romanji": ["kyou wa ame desu"],
    "meaning": "It is rainy today",
    "meaning_id": "Hari ini hujan",
  },
  {
    "jp_character": "天気がいいですね",
    "particles": [2, 7],
    "furigana": {"0": "てん", "1": "き"},
    "romanji": ["tenki ga ii desu ne"],
    "meaning": "The weather is nice, isn't it?",
    "meaning_id": "Cuacanya bagus ya",
  },
  {
    "jp_character": "水を飲みます",
    "particles": [1],
    "furigana": {"0": "みず", "2": "の"},
    "romanji": ["mizu wo nomimasu", "mizu o nomimasu"],
    "meaning": "I drink water",
    "meaning_id": "Saya minum air",
  },
  {
    "jp_character": "おちゃを飲みます",
    "particles": [3],
    "furigana": {"4": "の"},
    "romanji": ["ocha wo nomimasu", "ocha o nomimasu"],
    "meaning": "I drink tea",
    "meaning_id": "Saya minum teh",
  },
  {
    "jp_character": "コーヒーを飲みます",
    "particles": [4],
    "furigana": {"5": "の"},
    "romanji": ["koohii wo nomimasu", "koohii o nomimasu"],
    "meaning": "I drink coffee",
    "meaning_id": "Saya minum kopi",
  },
  {
    "jp_character": "うちに帰ります",
    "particles": [2],
    "furigana": {"3": "かえ"},
    "romanji": ["uchi ni kaerimasu"],
    "meaning": "I return home",
    "meaning_id": "Saya pulang ke rumah",
  },
  {
    "jp_character": "学校へ行きます",
    "particles": [2],
    "furigana": {"0": "がっ", "1": "こう", "3": "い"},
    "romanji": ["gakkou e ikimasu"],
    "meaning": "I go to school",
    "meaning_id": "Saya pergi ke sekolah",
  },
  {
    "jp_character": "日本へ行きます",
    "particles": [2],
    "furigana": {"0": "に", "1": "ほん", "3": "い"},
    "romanji": ["nihon e ikimasu"],
    "meaning": "I go to Japan",
    "meaning_id": "Saya pergi ke Jepang",
  },
  {
    "jp_character": "一人で行きます",
    "particles": [2],
    "furigana": {"0": "ひと", "1": "り", "3": "い"},
    "romanji": ["hitori de ikimasu"],
    "meaning": "I go alone",
    "meaning_id": "Saya pergi sendiri",
  },
  {
    "jp_character": "子どもが五人います",
    "particles": [3],
    "furigana": {"0": "こ", "4": "ご", "5": "にん"},
    "romanji": ["kodomo ga gonin imasu"],
    "meaning": "There are five children",
    "meaning_id": "Ada lima anak",
  },
  {
    "jp_character": "友だちに会います",
    "particles": [3],
    "furigana": {"0": "とも", "4": "あ"},
    "romanji": ["tomodachi ni aimasu"],
    "meaning": "I meet a friend",
    "meaning_id": "Saya bertemu dengan teman",
  },
  {
    "jp_character": "友だちと話します",
    "particles": [3],
    "furigana": {"0": "とも", "4": "はな"},
    "romanji": ["tomodachi to hanashimasu"],
    "meaning": "I talk with a friend",
    "meaning_id": "Saya berbicara dengan teman",
  },
  {
    "jp_character": "これは新しい本です",
    "particles": [2],
    "furigana": {"3": "あたら", "6": "ほん"},
    "romanji": ["kore wa atarashii hon desu"],
    "meaning": "This is a new book",
    "meaning_id": "Ini buku baru",
  },
  {
    "jp_character": "あの山は高いです",
    "particles": [3],
    "furigana": {"2": "やま", "4": "たか"},
    "romanji": ["ano yama wa takai desu"],
    "meaning": "That mountain is high",
    "meaning_id": "Gunung itu tinggi",
  },
  {
    "jp_character": "この店は安いです",
    "particles": [3],
    "furigana": {"2": "みせ", "4": "やす"},
    "romanji": ["kono mise wa yasui desu"],
    "meaning": "This shop is cheap",
    "meaning_id": "Toko ini murah",
  },
  {
    "jp_character": "今はなんじですか",
    "particles": [1, 7],
    "furigana": {"0": "いま"},
    "romanji": ["ima wa nanji desu ka"],
    "meaning": "What time is it now?",
    "meaning_id": "Sekarang jam berapa?",
  },
  {
    "jp_character": "今、三時半です",
    "particles": [],
    "furigana": {"0": "いま", "2": "さん", "3": "じ", "4": "はん"},
    "romanji": ["ima sanji han desu"],
    "meaning": "It is 3:30 now",
    "meaning_id": "Sekarang jam setengah empat",
  },
  {
    "jp_character": "今日は月曜日です",
    "particles": [2],
    "furigana": {"0": "きょ", "1": "う", "3": "げつ", "4": "よう", "5": "び"},
    "romanji": ["kyou wa getsuyoubi desu"],
    "meaning": "Today is Monday",
    "meaning_id": "Hari ini hari Senin",
  },
  {
    "jp_character": "あしたは火曜日です",
    "particles": [3],
    "furigana": {"4": "か", "5": "よう", "6": "び"},
    "romanji": ["ashita wa kayoubi desu"],
    "meaning": "Tomorrow is Tuesday",
    "meaning_id": "Besok hari Selasa",
  },
  {
    "jp_character": "あなたも学生ですか",
    "particles": [3, 8],
    "furigana": {"4": "がく", "5": "せい"},
    "romanji": ["anata mo gakusei desu ka"],
    "meaning": "Are you also a student?",
    "meaning_id": "Apakah Anda juga seorang pelajar?",
  },
  {
    "jp_character": "これはなんの本ですか",
    "particles": [2, 5, 9],
    "furigana": {"6": "ほん"},
    "romanji": ["kore wa nan no hon desu ka"],
    "meaning": "What kind of book is this?",
    "meaning_id": "Ini buku apa?",
  },
  {
    "jp_character": "あさごはんを食べます",
    "particles": [5],
    "furigana": {"6": "た"},
    "romanji": ["asagohan wo tabemasu", "asagohan o tabemasu"],
    "meaning": "I eat breakfast",
    "meaning_id": "Saya makan sarapan",
  },
  {
    "jp_character": "あさごはんを食べました",
    "particles": [5],
    "furigana": {"6": "た"},
    "romanji": ["asagohan wo tabemashita", "asagohan o tabemashita"],
    "meaning": "I ate breakfast",
    "meaning_id": "Saya sudah makan sarapan",
  },
  {
    "jp_character": "わたしは本を読みます",
    "particles": [3, 5],
    "furigana": {"4": "ほん", "6": "よ"},
    "romanji": ["watashi wa hon wo yomimasu", "watashi wa hon o yomimasu"],
    "meaning": "I read a book",
    "meaning_id": "Saya membaca buku",
  },
  {
    "jp_character": "日本語の本を読みます",
    "particles": [3, 5],
    "furigana": {"0": "に", "1": "ほん", "2": "ご", "4": "ほん", "6": "よ"},
    "romanji": ["nihongo no hon wo yomimasu", "nihongo no hon o yomimasu"],
    "meaning": "I read a Japanese book",
    "meaning_id": "Saya membaca buku bahasa Jepang",
  },
  {
    "jp_character": "店で水を買います",
    "particles": [1, 3],
    "furigana": {"0": "みせ", "2": "みず", "4": "か"},
    "romanji": ["mise de mizu wo kaimasu", "mise de mizu o kaimasu"],
    "meaning": "I buy water at the shop",
    "meaning_id": "Saya membeli air di toko",
  },
  {
    "jp_character": "きのう、友だちに会いました",
    "particles": [7],
    "furigana": {"4": "とも", "8": "あ"},
    "romanji": ["kinou tomodachi ni aimashita"],
    "meaning": "I met a friend yesterday",
    "meaning_id": "Kemarin saya bertemu teman",
  },
  {
    "jp_character": "電車で駅へ行きます",
    "particles": [2, 4],
    "furigana": {"0": "でん", "1": "しゃ", "3": "えき", "5": "い"},
    "romanji": ["densha de eki e ikimasu"],
    "meaning": "I go to the station by train",
    "meaning_id": "Saya pergi ke stasiun dengan kereta",
  },
  {
    "jp_character": "駅に店があります",
    "particles": [1, 3],
    "furigana": {"0": "えき", "2": "みせ"},
    "romanji": ["eki ni mise ga arimasu"],
    "meaning": "There is a shop at the station",
    "meaning_id": "Ada toko di stasiun",
  },
  {
    "jp_character": "山に木がたくさんあります",
    "particles": [1, 3],
    "furigana": {"0": "やま", "2": "き"},
    "romanji": ["yama ni ki ga takusan arimasu"],
    "meaning": "There are many trees on the mountain",
    "meaning_id": "Di gunung ada banyak pohon",
  },
  {
    "jp_character": "あそこに山と川があります",
    "particles": [3, 5, 7],
    "furigana": {"4": "やま", "6": "かわ"},
    "romanji": ["asoko ni yama to kawa ga arimasu"],
    "meaning": "There are a mountain and a river over there",
    "meaning_id": "Di sana ada gunung dan sungai",
  },
  {
    "jp_character": "川の水はきれいです",
    "particles": [1, 3],
    "furigana": {"0": "かわ", "2": "みず"},
    "romanji": ["kawa no mizu wa kirei desu"],
    "meaning": "The river water is clean",
    "meaning_id": "Air sungai itu bersih",
  },
  {
    "jp_character": "お国はどちらですか",
    "particles": [2, 8],
    "furigana": {"1": "くに"},
    "romanji": ["okuni wa dochira desu ka"],
    "meaning": "Where are you from?",
    "meaning_id": "Anda dari negara mana?",
  },
  {
    "jp_character": "あの人はわたしの先生です",
    "particles": [3, 7],
    "furigana": {"2": "ひと", "8": "せん", "9": "せい"},
    "romanji": ["ano hito wa watashi no sensei desu"],
    "meaning": "That person is my teacher",
    "meaning_id": "Orang itu adalah guru saya",
  },
  {
    "jp_character": "学生が三百人います",
    "particles": [2],
    "furigana": {"0": "がく", "1": "せい", "3": "さん", "4": "びゃく", "5": "にん"},
    "romanji": ["gakusei ga sanbyaku nin imasu"],
    "meaning": "There are three hundred students",
    "meaning_id": "Ada tiga ratus pelajar",
  },
  {
    "jp_character": "白い車を見ました",
    "particles": [3],
    "furigana": {"0": "しろ", "2": "くるま", "4": "み"},
    "romanji": ["shiroi kuruma wo mimashita", "shiroi kuruma o mimashita"],
    "meaning": "I saw a white car",
    "meaning_id": "Saya melihat mobil putih",
  },
  {
    "jp_character": "新しい車を買いました",
    "particles": [4],
    "furigana": {"0": "あたら", "3": "くるま", "5": "か"},
    "romanji": ["atarashii kuruma wo kaimashita", "atarashii kuruma o kaimashita"],
    "meaning": "I bought a new car",
    "meaning_id": "Saya membeli mobil baru",
  },
  {
    "jp_character": "今日はここで休みます",
    "particles": [2, 5],
    "furigana": {"0": "きょ", "1": "う", "6": "やす"},
    "romanji": ["kyou wa koko de yasumimasu"],
    "meaning": "Today I rest here",
    "meaning_id": "Hari ini saya beristirahat di sini",
  },
  {
    "jp_character": "この電車は北へ行きます",
    "particles": [4, 6],
    "furigana": {"2": "でん", "3": "しゃ", "5": "きた", "7": "い"},
    "romanji": ["kono densha wa kita e ikimasu"],
    "meaning": "This train goes north",
    "meaning_id": "Kereta ini pergi ke utara",
  },
  {
    "jp_character": "毎日、日本語をべんきょうします",
    "particles": [6],
    "furigana": {"0": "まい", "1": "にち", "3": "に", "4": "ほん", "5": "ご"},
    "romanji": ["mainichi nihongo wo benkyou shimasu", "mainichi nihongo o benkyou shimasu"],
    "meaning": "I study Japanese every day",
    "meaning_id": "Saya belajar bahasa Jepang setiap hari",
  },
  {
    "jp_character": "学校で日本語を読みます",
    "particles": [2, 6],
    "furigana": {"0": "がっ", "1": "こう", "3": "に", "4": "ほん", "5": "ご", "7": "よ"},
    "romanji": ["gakkou de nihongo wo yomimasu", "gakkou de nihongo o yomimasu"],
    "meaning": "I read Japanese at school",
    "meaning_id": "Saya membaca bahasa Jepang di sekolah",
  },
  {
    "jp_character": "毎週、山へ行きます",
    "particles": [4],
    "furigana": {"0": "まい", "1": "しゅう", "3": "やま", "5": "い"},
    "romanji": ["maishuu yama e ikimasu"],
    "meaning": "I go to the mountain every week",
    "meaning_id": "Setiap minggu saya pergi ke gunung",
  },
  {
    "jp_character": "わたしの父は毎日、新聞を読みます",
    "particles": [3, 5, 11],
    "furigana": {"4": "ちち", "6": "まい", "7": "にち", "9": "しん", "10": "ぶん", "12": "よ"},
    "romanji": ["watashi no chichi wa mainichi shinbun wo yomimasu", "watashi no chichi wa mainichi shinbun o yomimasu"],
    "meaning": "My father reads the newspaper every day",
    "meaning_id": "Ayah saya membaca koran setiap hari",
  },
  {
    "jp_character": "わたしは毎日、電車で学校へ行きます",
    "particles": [3, 9, 12],
    "furigana": {"4": "まい", "5": "にち", "7": "でん", "8": "しゃ", "10": "がっ", "11": "こう", "13": "い"},
    "romanji": ["watashi wa mainichi densha de gakkou e ikimasu"],
    "meaning": "I go to school by train every day",
    "meaning_id": "Setiap hari saya pergi ke sekolah dengan kereta",
  },
];

// The hand-written sentences above are extended with the generated pool
// (scripts/generateSentences.mjs), which offers enough coverage for any
// realistic group selection.
sentences.push(...generatedSentences);

// Everyday conversation set: 100 imperative, 100 question and 100 answer
// sentences in kana only (see dailySentences.js), plus the child sentences
// by age group (toddler, elementary, junior high in kidsSentences.js) and the
// 295 sentences built from the words.json vocabulary (wordSentences.js).
// Duplicates of anything already in the pool are skipped so a sentence is
// only practiced once.
const seenJpCharacters = new Set(sentences.map(sentence => sentence.jp_character));
for (const sentence of [...imperativeSentences, ...questionSentences, ...answerSentences, ...toddlerSentences, ...elementarySentences, ...juniorHighSentences, ...wordSentences]) {
  if (seenJpCharacters.has(sentence.jp_character)) continue;
  seenJpCharacters.add(sentence.jp_character);
  sentences.push(sentence);
}
addIndonesianMeanings(sentences);

// jp_character -> title of the group it belongs to, for every selectable
// kana and kanji. Small kana (っ, ょ, ゅ...), ー and punctuation are not part
// of any group in kanaCharacters.js, so they are ignored when checking a
// sentence (they can be read as soon as the other characters can)
const groupTitleByCharacter = {};
for (const script of ['hiragana', 'katakana', 'kanji']) {
  for (const group of Object.values(kanaCharacters[script] || {})) {
    for (const character of Object.values(group.characters || {})) {
      if (character && character.jp_character && !(character.jp_character in groupTitleByCharacter)) {
        groupTitleByCharacter[character.jp_character] = group.title;
      }
    }
  }
}

// Sentences are only offered when every group their kana and kanji belong to
// has been selected, just like the words mode only shows words that can be
// read with the selected kana groups
export function getReadableSentences(selectedGroupTitles) {
  const selected = Array.isArray(selectedGroupTitles) ? selectedGroupTitles : [];
  return sentences.filter(sentence =>
    [...sentence.jp_character].every(character => {
      const title = groupTitleByCharacter[character];
      return !title || selected.includes(title);
    })
  );
}

// ---------- Sentence practice options (chosen in the menu) ----------

// How long a sentence is: easy up to 5 words, medium 6, hard 7 or more
export function sentenceLevel(sentence) {
  const words = String(sentence.romanji[0]).split(' ').length;
  if (words <= 5) return 'easy';
  if (words === 6) return 'medium';
  return 'hard';
}

// The grammar pattern a sentence practices: set by its template, or read
// from how it ends
export function sentencePattern(sentence) {
  if (sentence.pattern) return sentence.pattern;
  const jp = sentence.jp_character;
  if (/か$/.test(jp)) return 'question';
  if (/(あります|います|ありました|いました)$/.test(jp)) return 'exist';
  if (/(ます|ました)$/.test(jp)) return 'verb';
  return 'desu';
}

// JLPT level of the grammar a sentence practices (N5 unless its template says N4)
export function sentenceJlpt(sentence) {
  return sentence.jlpt || 'N5';
}

export { SENTENCE_LEVELS, SENTENCE_JLPT_LEVELS, SENTENCE_PATTERNS, SENTENCE_EXERCISES, SENTENCE_TOPICS, SENTENCE_TOPIC_KEY, getSentenceTopic, sentenceInTopic, getSentenceOptions } from './practiceOptions.js';

// The sentences offered with the selected groups and the sentence options
// of the menu (the particle exercise needs a sentence with a particle)
export function getPracticeSentences(selectedGroupTitles, options = getSentenceOptions()) {
  return getReadableSentences(selectedGroupTitles).filter(sentence =>
    (options.level === 'all' || sentenceLevel(sentence) === options.level) &&
    (options.pattern === 'all' || sentencePattern(sentence) === options.pattern) &&
    (!options.jlpt || options.jlpt === 'all' || sentenceJlpt(sentence) === options.jlpt) &&
    sentenceInTopic(sentence, options.topic) &&
    (options.exercise !== 'particle' || (sentence.particles || []).length > 0)
  );
}
