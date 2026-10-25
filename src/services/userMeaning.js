import { hasGeminiKey, translateText } from './geminiChat.js';

/* Dictionary of common beginner Japanese phrases and greetings with
 * Indonesian (id) and English (en) meanings.
 */
const COMMON_PHRASES = [
  // Greetings & daily polite expressions
  { jp: 'こんにちは', id: 'Halo / Selamat siang', en: 'Hello / Good afternoon' },
  { jp: 'おはよう', id: 'Selamat pagi', en: 'Good morning' },
  { jp: 'おはようございます', id: 'Selamat pagi (sopan)', en: 'Good morning (polite)' },
  { jp: 'こんばんは', id: 'Selamat malam', en: 'Good evening' },
  { jp: 'おやすみ', id: 'Selamat tidur', en: 'Good night' },
  { jp: 'おやすみなさい', id: 'Selamat tidur (sopan)', en: 'Good night (polite)' },
  { jp: 'さようなら', id: 'Selamat tinggal', en: 'Goodbye' },
  { jp: 'またね', id: 'Sampai jumpa lagi', en: 'See you later' },
  { jp: 'じゃあね', id: 'Sampai jumpa', en: 'See you' },
  { jp: 'はじめまして', id: 'Salam kenal', en: 'Nice to meet you' },
  { jp: 'どうぞよろしく', id: 'Senang berkenalan denganmu', en: 'Pleased to meet you' },
  { jp: 'よろしくおねがいします', id: 'Mohon bantuannya / Salam kenal', en: 'Nice to meet you / Please treat me well' },
  { jp: 'おねがいします', id: 'Tolong / Mohon bantuannya', en: 'Please' },
  { jp: 'ありがとう', id: 'Terima kasih', en: 'Thank you' },
  { jp: 'ありがとうございます', id: 'Terima kasih banyak', en: 'Thank you very much' },
  { jp: 'どうもありがとうございます', id: 'Terima kasih banyak sekali', en: 'Thank you very much' },
  { jp: 'どういたしまして', id: 'Sama-sama', en: "You're welcome" },
  { jp: 'すみません', id: 'Permisi / Maaf', en: 'Excuse me / Sorry' },
  { jp: 'ごめんなさい', id: 'Mohon maaf', en: 'I am sorry' },
  { jp: 'しつれいします', id: 'Permisi (sopan)', en: 'Excuse me' },

  // Affirmations & simple responses
  { jp: 'はい', id: 'Ya', en: 'Yes' },
  { jp: 'いいえ', id: 'Tidak / Bukan', en: 'No' },
  { jp: 'うん', id: 'Ya (santai)', en: 'Yeah' },
  { jp: 'ううん', id: 'Tidak (santai)', en: 'Nope' },
  { jp: 'はい、そうです', id: 'Ya, benar', en: "Yes, that's right" },
  { jp: 'いいえ、ちがいます', id: 'Bukan, salah', en: "No, that's wrong" },
  { jp: 'わかりました', id: 'Saya mengerti / paham', en: 'I understand' },
  { jp: 'わかりません', id: 'Saya tidak mengerti', en: "I don't understand" },
  { jp: 'しりません', id: 'Saya tidak tahu', en: "I don't know" },
  { jp: 'だいじょうぶ', id: 'Tidak apa-apa', en: "It's okay" },
  { jp: 'だいじょうぶです', id: 'Tidak apa-apa / baik-baik saja', en: "It's fine / I am okay" },
  { jp: 'もういちど おねがいします', id: 'Tolong sekali lagi', en: 'Once more, please' },
  { jp: 'もういちどおねがいします', id: 'Tolong sekali lagi', en: 'Once more, please' },
  { jp: 'ちょっと まってください', id: 'Tunggu sebentar ya', en: 'Wait a moment, please' },
  { jp: 'ちょっとまってください', id: 'Tunggu sebentar ya', en: 'Wait a moment, please' },
  { jp: 'そうですか', id: 'Begitu ya', en: 'Is that so / I see' },
  { jp: 'なるほど', id: 'Begitu rupanya / paham', en: 'I see / That makes sense' },
  { jp: 'もちろん', id: 'Tentu saja', en: 'Of course' },
  { jp: 'もちろん です', id: 'Tentu saja (sopan)', en: 'Of course' },
  { jp: 'もちろんです', id: 'Tentu saja', en: 'Of course' },

  // Questions & self-introductions
  { jp: 'おなまえは？', id: 'Siapa namamu?', en: 'What is your name?' },
  { jp: 'おなまえは なんですか', id: 'Siapa namamu?', en: 'What is your name?' },
  { jp: 'おなまえはなんですか', id: 'Siapa namamu?', en: 'What is your name?' },
  { jp: 'おなまえはなんですか？', id: 'Siapa namamu?', en: 'What is your name?' },
  { jp: 'げんきですか？', id: 'Apa kabar?', en: 'How are you?' },
  { jp: 'げんきですか', id: 'Apa kabar?', en: 'How are you?' },
  { jp: 'おげんきですか', id: 'Bagaimana kabar Anda?', en: 'How are you?' },
  { jp: 'おげんきですか？', id: 'Bagaimana kabar Anda?', en: 'How are you?' },
  { jp: 'げんきです', id: 'Saya sehat / kabar baik', en: "I'm doing well" },
  { jp: 'にほんごを べんきょうしています', id: 'Sedang belajar bhs Jepang', en: 'I am studying Japanese' },
  { jp: 'にほんごをべんきょうしています', id: 'Sedang belajar bahasa Jepang', en: 'I am studying Japanese' },
  { jp: 'にほんごが すきです', id: 'Saya suka bahasa Jepang', en: 'I like Japanese' },
  { jp: 'にほんごがすきです', id: 'Saya suka bahasa Jepang', en: 'I like Japanese' },
  { jp: 'インドネシアじんです', id: 'Saya orang Indonesia', en: 'I am Indonesian' },
  { jp: 'がくせいです', id: 'Saya seorang pelajar/siswa', en: 'I am a student' },
  { jp: 'せんせいです', id: 'Saya seorang guru', en: 'I am a teacher' },
  { jp: 'おいしいです', id: 'Enak', en: 'Delicious' },
  { jp: 'たのしいです', id: 'Menyenangkan', en: 'Fun / enjoyable' },
  { jp: 'すきです', id: 'Suka', en: 'I like it' },
  { jp: 'きらいです', id: 'Tidak suka', en: 'I dislike it' },
];

const meaningCache = new Map();

function normalize(text) {
  return String(text || '').trim().replace(/[\s\u3000、。！？.!?]+/g, '');
}

/* Fast local lookup for common beginner phrases */
export function lookupUserMeaning(text, language = 'id') {
  if (!text) return '';
  const norm = normalize(text);
  if (!norm) return '';

  const cacheKey = `${language}:${norm}`;
  if (meaningCache.has(cacheKey)) {
    return meaningCache.get(cacheKey);
  }

  // 1. Direct match in dictionary
  const exact = COMMON_PHRASES.find(p => normalize(p.jp) === norm);
  if (exact) {
    const res = language === 'id' ? exact.id : exact.en;
    meaningCache.set(cacheKey, res);
    return res;
  }

  // 2. Pattern: わたしは [name/noun] です -> Saya adalah [name/noun]
  const nameMatch = text.match(/^(?:わたし|ぼく|おれ)は\s*([^\sです]+)\s*です$/);
  if (nameMatch) {
    const noun = nameMatch[1];
    const res = language === 'id' ? `Saya adalah ${noun}` : `I am ${noun}`;
    meaningCache.set(cacheKey, res);
    return res;
  }

  // 3. Pattern: [noun] がすきです -> Saya suka [noun]
  const likeMatch = text.match(/^(.+)[がは]\s*すきです$/);
  if (likeMatch) {
    const item = likeMatch[1];
    const res = language === 'id' ? `Saya suka ${item}` : `I like ${item}`;
    meaningCache.set(cacheKey, res);
    return res;
  }

  return '';
}

/* Async translation: checks local dictionary first, then queries Gemini API if key is set */
export async function resolveUserMeaning(text, language = 'id') {
  if (!text) return '';
  const local = lookupUserMeaning(text, language);
  if (local) return local;

  const norm = normalize(text);
  const cacheKey = `${language}:${norm}`;
  if (meaningCache.has(cacheKey)) {
    return meaningCache.get(cacheKey);
  }

  if (hasGeminiKey()) {
    try {
      const translated = await translateText(text, language);
      if (translated) {
        meaningCache.set(cacheKey, translated);
        return translated;
      }
    } catch {
      // fallback
    }
  }

  return '';
}

export function clearUserMeaningCache() {
  meaningCache.clear();
}
