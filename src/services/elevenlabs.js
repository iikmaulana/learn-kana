import { speak, isSpeechSupported } from '../speech.js';

const DEFAULT_BOT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (premade, clean & warm tutor voice, supported on free tier)
const DEFAULT_USER_VOICE_ID = 'r6PXps8L8e51YofYDNqb'; // Configured user voice
const FALLBACK_FREE_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // Charlie (premade voice supported on free tier)

const audioCache = new Map();
let currentAudio = null;

function stripQuotes(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/^["']|["']$/g, '').trim();
}

export function hasElevenLabsKey(role = 'bot') {
  if (role === 'user') {
    const userKey = stripQuotes(import.meta.env?.VITE_ELEVENLABS_USER_API_KEY);
    if (userKey) return true;
  }
  const key = stripQuotes(import.meta.env?.VITE_ELEVENLABS_API_KEY);
  return key.length > 0;
}

export function hasElevenLabsUserKey() {
  return hasElevenLabsKey('user');
}

export function getElevenLabsVoiceId(role = 'bot') {
  if (role === 'user') {
    const userVoice = stripQuotes(import.meta.env?.VITE_ELEVENLABS_USER_VOICE_ID);
    return userVoice || DEFAULT_USER_VOICE_ID;
  }
  const voiceId = stripQuotes(import.meta.env?.VITE_ELEVENLABS_VOICE_ID);
  return voiceId || DEFAULT_BOT_VOICE_ID;
}

export function stopElevenLabsAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
}

async function requestElevenLabsTts(text, key, voiceId) {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': key,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_v4',
      language_code: 'jv',
      voice_settings: {
        stability: 0.40,
        similarity_boost: 0.75,
        speed: -1.5,
      },
    }),
  });
}

export async function fetchElevenLabsAudio(text, { apiKey, voiceId, role = 'bot' } = {}) {
  let key = stripQuotes(apiKey);
  if (!key) {
    if (role === 'user') {
      key = stripQuotes(import.meta.env?.VITE_ELEVENLABS_USER_API_KEY) || stripQuotes(import.meta.env?.VITE_ELEVENLABS_API_KEY);
    } else {
      key = stripQuotes(import.meta.env?.VITE_ELEVENLABS_API_KEY);
    }
  }

  const vid = stripQuotes(voiceId) || getElevenLabsVoiceId(role);

  if (!key) throw new Error('NO_API_KEY');

  let response = await requestElevenLabsTts(text, key, vid);

  // If 402 Payment Required (e.g. library voice requested on a Free plan), attempt fallback to a premade voice
  if (!response.ok && response.status === 402 && vid !== FALLBACK_FREE_VOICE_ID) {
    console.warn(`ElevenLabs voice ${vid} requires paid plan (HTTP 402). Falling back to premade voice ${FALLBACK_FREE_VOICE_ID}...`);
    const fallbackResponse = await requestElevenLabsTts(text, key, FALLBACK_FREE_VOICE_ID);
    if (fallbackResponse.ok) {
      response = fallbackResponse;
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`ELEVENLABS_HTTP_${response.status}: ${errorText}`);
  }

  const blob = await response.blob();
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    return URL.createObjectURL(blob);
  }
  return null;
}

export async function playBotSpeech(text) {
  if (!text) return;

  if (hasElevenLabsKey('bot')) {
    try {
      stopElevenLabsAudio();
      const cacheKey = `bot:${text}`;
      let url = audioCache.get(cacheKey);
      if (!url) {
        url = await fetchElevenLabsAudio(text, { role: 'bot' });
        if (url) {
          audioCache.set(cacheKey, url);
        }
      }
      if (url && typeof Audio !== 'undefined') {
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('ElevenLabs bot TTS failed, falling back to Web Speech:', err);
    }
  }

  if (isSpeechSupported()) {
    speak(text);
  }
}

export async function playUserSpeech(text) {
  if (!text) return;

  if (hasElevenLabsKey('user')) {
    try {
      stopElevenLabsAudio();
      const cacheKey = `user:${text}`;
      let url = audioCache.get(cacheKey);
      if (!url) {
        url = await fetchElevenLabsAudio(text, { role: 'user' });
        if (url) {
          audioCache.set(cacheKey, url);
        }
      }
      if (url && typeof Audio !== 'undefined') {
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('ElevenLabs user TTS failed, falling back to Web Speech:', err);
    }
  }

  if (isSpeechSupported()) {
    speak(text);
  }
}

export function clearElevenLabsCache() {
  audioCache.forEach((url) => {
    try {
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    }
  });
  audioCache.clear();
}

