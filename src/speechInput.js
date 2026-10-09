import { toRomaji } from 'wanakana';

// Web Speech API support differs per browser: Chrome/Edge ship it unprefixed,
// Safari as window.webkitSpeechRecognition, Firefox not at all. The mic
// button in the game is only offered when a recognizer exists.
export function getSpeechRecognitionClass() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// Turn what the recognizer heard into the plain romaji the game compares
// against. ja-JP recognition may transcribe common words as kanji (hearing
// わたし and returning 私), and kanji have no single reading, so everything
// that is not romaji is dropped; matchSpokenAnswer below is tolerant about
// the gaps that leaves.
export function japaneseToRomaji(text) {
  return toRomaji(String(text ?? ''))
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^a-z]/g, '');
}

// True when every character of `needle` appears in `haystack` in order.
export function isSubsequence(needle, haystack) {
  if (!needle) return false;
  let needleIndex = 0;
  for (const char of haystack) {
    if (char === needle[needleIndex]) needleIndex += 1;
    if (needleIndex === needle.length) return true;
  }
  return false;
}

// Readings are written the way players type them, with the particles in
// their written form (wa, e, o), but a recognizer hears them as spoken:
// は→ha, へ→he, を→o (romanized wo). Rebuild the romaji of the spoken form
// so speech can be matched against it. Tokens are whitespace-separated, so
// wa inside a word is left alone.
const PARTICLE_TOKEN_TO_SPEECH = {
  wa: 'ha',
  e: 'he',
  o: 'wo',
};

export function spokenFormOfReading(reading) {
  return String(reading ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(token => PARTICLE_TOKEN_TO_SPEECH[token] ?? token)
    .join('');
}

// Returns the index of the accepted answer the spoken romaji satisfies, or
// -1. Exact match first; afterwards a tolerant match for recognizer
// hiccups: the spoken text must appear inside an accepted answer in the
// right order and cover at least about half of it, so one dropped word
// (transcribed as kanji and stripped) does not break an otherwise correct
// answer, while a single syllable does not count as answering.
export function matchSpokenAnswer(spokenRomaji, acceptedAnswers) {
  if (!spokenRomaji) return -1;
  const exactIndex = acceptedAnswers.findIndex(answer => answer === spokenRomaji);
  if (exactIndex !== -1) return exactIndex;
  return acceptedAnswers.findIndex(answer =>
    spokenRomaji.length >= 3 &&
    spokenRomaji.length >= answer.length * 0.5 &&
    isSubsequence(spokenRomaji, answer)
  );
}
