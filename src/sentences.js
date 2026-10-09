import { kanaCharacters } from './kanaCharacters.js';
import { generatedSentences } from './generatedSentences.js';

/* Sentence data for the "sentences" (long typing) practice: real, correct
 * beginner sentences that are typed as a single romaji answer.
 *
 * - "jp_character" is the full sentence shown on screen.
 * - "particles" lists the character indices of the particles (は, を,
 *   に...) so the game can show them in a different color.
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
    "romanji": ["kore wa mizu desu"],
    "meaning": "This is water",
    "meaning_id": "Ini air",
  },
  {
    "jp_character": "ここは駅です",
    "particles": [2],
    "romanji": ["koko wa eki desu"],
    "meaning": "This is the station",
    "meaning_id": "Di sini adalah stasiun",
  },
  {
    "jp_character": "あれは学校です",
    "particles": [2],
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
    "romanji": ["watashi wa gakusei desu"],
    "meaning": "I am a student",
    "meaning_id": "Saya seorang pelajar",
  },
  {
    "jp_character": "わたしは日本人です",
    "particles": [3],
    "romanji": ["watashi wa nihonjin desu"],
    "meaning": "I am Japanese",
    "meaning_id": "Saya orang Jepang",
  },
  {
    "jp_character": "あなたは先生です",
    "particles": [3],
    "romanji": ["anata wa sensei desu"],
    "meaning": "You are a teacher",
    "meaning_id": "Anda seorang guru",
  },
  {
    "jp_character": "今日は雨です",
    "particles": [2],
    "romanji": ["kyou wa ame desu"],
    "meaning": "It is rainy today",
    "meaning_id": "Hari ini hujan",
  },
  {
    "jp_character": "天気がいいですね",
    "particles": [2, 7],
    "romanji": ["tenki ga ii desu ne"],
    "meaning": "The weather is nice, isn't it?",
    "meaning_id": "Cuacanya bagus ya",
  },
  {
    "jp_character": "水を飲みます",
    "particles": [1],
    "romanji": ["mizu wo nomimasu", "mizu o nomimasu"],
    "meaning": "I drink water",
    "meaning_id": "Saya minum air",
  },
  {
    "jp_character": "おちゃを飲みます",
    "particles": [3],
    "romanji": ["ocha wo nomimasu", "ocha o nomimasu"],
    "meaning": "I drink tea",
    "meaning_id": "Saya minum teh",
  },
  {
    "jp_character": "コーヒーを飲みます",
    "particles": [4],
    "romanji": ["koohii wo nomimasu", "koohii o nomimasu"],
    "meaning": "I drink coffee",
    "meaning_id": "Saya minum kopi",
  },
  {
    "jp_character": "うちに帰ります",
    "particles": [2],
    "romanji": ["uchi ni kaerimasu"],
    "meaning": "I return home",
    "meaning_id": "Saya pulang ke rumah",
  },
  {
    "jp_character": "学校へ行きます",
    "particles": [2],
    "romanji": ["gakkou e ikimasu"],
    "meaning": "I go to school",
    "meaning_id": "Saya pergi ke sekolah",
  },
  {
    "jp_character": "日本へ行きます",
    "particles": [2],
    "romanji": ["nihon e ikimasu"],
    "meaning": "I go to Japan",
    "meaning_id": "Saya pergi ke Jepang",
  },
  {
    "jp_character": "一人で行きます",
    "particles": [2],
    "romanji": ["hitori de ikimasu"],
    "meaning": "I go alone",
    "meaning_id": "Saya pergi sendiri",
  },
  {
    "jp_character": "子どもが五人います",
    "particles": [3],
    "romanji": ["kodomo ga gonin imasu"],
    "meaning": "There are five children",
    "meaning_id": "Ada lima anak",
  },
  {
    "jp_character": "友だちに会います",
    "particles": [3],
    "romanji": ["tomodachi ni aimasu"],
    "meaning": "I meet a friend",
    "meaning_id": "Saya bertemu dengan teman",
  },
  {
    "jp_character": "友だちと話します",
    "particles": [3],
    "romanji": ["tomodachi to hanashimasu"],
    "meaning": "I talk with a friend",
    "meaning_id": "Saya berbicara dengan teman",
  },
  {
    "jp_character": "これは新しい本です",
    "particles": [2],
    "romanji": ["kore wa atarashii hon desu"],
    "meaning": "This is a new book",
    "meaning_id": "Ini buku baru",
  },
  {
    "jp_character": "あの山は高いです",
    "particles": [3],
    "romanji": ["ano yama wa takai desu"],
    "meaning": "That mountain is high",
    "meaning_id": "Gunung itu tinggi",
  },
  {
    "jp_character": "この店は安いです",
    "particles": [3],
    "romanji": ["kono mise wa yasui desu"],
    "meaning": "This shop is cheap",
    "meaning_id": "Toko ini murah",
  },
  {
    "jp_character": "今はなんじですか",
    "particles": [1, 7],
    "romanji": ["ima wa nanji desu ka"],
    "meaning": "What time is it now?",
    "meaning_id": "Sekarang jam berapa?",
  },
  {
    "jp_character": "今、三時半です",
    "particles": [],
    "romanji": ["ima sanji han desu"],
    "meaning": "It is 3:30 now",
    "meaning_id": "Sekarang jam setengah empat",
  },
  {
    "jp_character": "今日は月曜日です",
    "particles": [2],
    "romanji": ["kyou wa getsuyoubi desu"],
    "meaning": "Today is Monday",
    "meaning_id": "Hari ini hari Senin",
  },
  {
    "jp_character": "あしたは火曜日です",
    "particles": [3],
    "romanji": ["ashita wa kayoubi desu"],
    "meaning": "Tomorrow is Tuesday",
    "meaning_id": "Besok hari Selasa",
  },
  {
    "jp_character": "あなたも学生ですか",
    "particles": [3, 8],
    "romanji": ["anata mo gakusei desu ka"],
    "meaning": "Are you also a student?",
    "meaning_id": "Apakah Anda juga seorang pelajar?",
  },
  {
    "jp_character": "これはなんの本ですか",
    "particles": [2, 5, 9],
    "romanji": ["kore wa nan no hon desu ka"],
    "meaning": "What kind of book is this?",
    "meaning_id": "Ini buku apa?",
  },
  {
    "jp_character": "あさごはんを食べます",
    "particles": [5],
    "romanji": ["asagohan wo tabemasu", "asagohan o tabemasu"],
    "meaning": "I eat breakfast",
    "meaning_id": "Saya makan sarapan",
  },
  {
    "jp_character": "あさごはんを食べました",
    "particles": [5],
    "romanji": ["asagohan wo tabemashita", "asagohan o tabemashita"],
    "meaning": "I ate breakfast",
    "meaning_id": "Saya sudah makan sarapan",
  },
  {
    "jp_character": "わたしは本を読みます",
    "particles": [3, 5],
    "romanji": ["watashi wa hon wo yomimasu", "watashi wa hon o yomimasu"],
    "meaning": "I read a book",
    "meaning_id": "Saya membaca buku",
  },
  {
    "jp_character": "日本語の本を読みます",
    "particles": [3, 5],
    "romanji": ["nihongo no hon wo yomimasu", "nihongo no hon o yomimasu"],
    "meaning": "I read a Japanese book",
    "meaning_id": "Saya membaca buku bahasa Jepang",
  },
  {
    "jp_character": "店で水を買います",
    "particles": [1, 3],
    "romanji": ["mise de mizu wo kaimasu", "mise de mizu o kaimasu"],
    "meaning": "I buy water at the shop",
    "meaning_id": "Saya membeli air di toko",
  },
  {
    "jp_character": "きのう、友だちに会いました",
    "particles": [7],
    "romanji": ["kinou tomodachi ni aimashita"],
    "meaning": "I met a friend yesterday",
    "meaning_id": "Kemarin saya bertemu teman",
  },
  {
    "jp_character": "電車で駅へ行きます",
    "particles": [2, 4],
    "romanji": ["densha de eki e ikimasu"],
    "meaning": "I go to the station by train",
    "meaning_id": "Saya pergi ke stasiun dengan kereta",
  },
  {
    "jp_character": "駅に店があります",
    "particles": [1, 3],
    "romanji": ["eki ni mise ga arimasu"],
    "meaning": "There is a shop at the station",
    "meaning_id": "Ada toko di stasiun",
  },
  {
    "jp_character": "山に木がたくさんあります",
    "particles": [1, 3],
    "romanji": ["yama ni ki ga takusan arimasu"],
    "meaning": "There are many trees on the mountain",
    "meaning_id": "Di gunung ada banyak pohon",
  },
  {
    "jp_character": "あそこに山と川があります",
    "particles": [3, 5, 7],
    "romanji": ["asoko ni yama to kawa ga arimasu"],
    "meaning": "There are a mountain and a river over there",
    "meaning_id": "Di sana ada gunung dan sungai",
  },
  {
    "jp_character": "川の水はきれいです",
    "particles": [1, 3],
    "romanji": ["kawa no mizu wa kirei desu"],
    "meaning": "The river water is clean",
    "meaning_id": "Air sungai itu bersih",
  },
  {
    "jp_character": "お国はどちらですか",
    "particles": [2, 8],
    "romanji": ["okuni wa dochira desu ka"],
    "meaning": "Where are you from?",
    "meaning_id": "Anda dari negara mana?",
  },
  {
    "jp_character": "あの人はわたしの先生です",
    "particles": [3, 7],
    "romanji": ["ano hito wa watashi no sensei desu"],
    "meaning": "That person is my teacher",
    "meaning_id": "Orang itu adalah guru saya",
  },
  {
    "jp_character": "学生が三百人います",
    "particles": [2],
    "romanji": ["gakusei ga sanbyaku nin imasu"],
    "meaning": "There are three hundred students",
    "meaning_id": "Ada tiga ratus pelajar",
  },
  {
    "jp_character": "白い車を見ました",
    "particles": [3],
    "romanji": ["shiroi kuruma wo mimashita", "shiroi kuruma o mimashita"],
    "meaning": "I saw a white car",
    "meaning_id": "Saya melihat mobil putih",
  },
  {
    "jp_character": "新しい車を買いました",
    "particles": [4],
    "romanji": ["atarashii kuruma wo kaimashita", "atarashii kuruma o kaimashita"],
    "meaning": "I bought a new car",
    "meaning_id": "Saya membeli mobil baru",
  },
  {
    "jp_character": "今日はここで休みます",
    "particles": [2, 5],
    "romanji": ["kyou wa koko de yasumimasu"],
    "meaning": "Today I rest here",
    "meaning_id": "Hari ini saya beristirahat di sini",
  },
  {
    "jp_character": "この電車は北へ行きます",
    "particles": [4, 6],
    "romanji": ["kono densha wa kita e ikimasu"],
    "meaning": "This train goes north",
    "meaning_id": "Kereta ini pergi ke utara",
  },
  {
    "jp_character": "毎日、日本語をべんきょうします",
    "particles": [6],
    "romanji": ["mainichi nihongo wo benkyou shimasu", "mainichi nihongo o benkyou shimasu"],
    "meaning": "I study Japanese every day",
    "meaning_id": "Saya belajar bahasa Jepang setiap hari",
  },
  {
    "jp_character": "学校で日本語を読みます",
    "particles": [2, 6],
    "romanji": ["gakkou de nihongo wo yomimasu", "gakkou de nihongo o yomimasu"],
    "meaning": "I read Japanese at school",
    "meaning_id": "Saya membaca bahasa Jepang di sekolah",
  },
  {
    "jp_character": "毎週、山へ行きます",
    "particles": [4],
    "romanji": ["maishuu yama e ikimasu"],
    "meaning": "I go to the mountain every week",
    "meaning_id": "Setiap minggu saya pergi ke gunung",
  },
  {
    "jp_character": "わたしの父は毎日、新聞を読みます",
    "particles": [3, 5, 11],
    "romanji": ["watashi no chichi wa mainichi shinbun wo yomimasu", "watashi no chichi wa mainichi shinbun o yomimasu"],
    "meaning": "My father reads the newspaper every day",
    "meaning_id": "Ayah saya membaca koran setiap hari",
  },
  {
    "jp_character": "わたしは毎日、電車で学校へ行きます",
    "particles": [3, 9, 12],
    "romanji": ["watashi wa mainichi densha de gakkou e ikimasu"],
    "meaning": "I go to school by train every day",
    "meaning_id": "Setiap hari saya pergi ke sekolah dengan kereta",
  },
];

// The hand-written sentences above are extended with the generated pool
// (scripts/generateSentences.mjs), which offers enough coverage for any
// realistic group selection.
sentences.push(...generatedSentences);

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
