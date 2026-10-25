import { speak, isSpeechSupported } from '../speech.js';

const DEFAULT_BOT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (premade, clean & warm tutor voice, supported on free tier)
const DEFAULT_USER_VOICE_ID = 'r6PXps8L8e51YofYDNqb'; // Configured user voice
const FALLBACK_FREE_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // Charlie (premade voice supported on free tier)

const audioCache = new Map();
let currentAudio = null;
let activeWebSpeechTimer = null;

const DB_NAME = 'learn_kana_audio_v1';
const STORE_NAME = 'audio_blobs';

function openAudioDb() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getStoredAudio(key) {
  try {
    const db = await openAudioDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function saveStoredAudio(key, blob) {
  try {
    const db = await openAudioDb();
    if (!db) return false;
    let data;
    if (typeof blob.arrayBuffer === 'function') {
      const buffer = await blob.arrayBuffer();
      data = { buffer, type: blob.type || 'audio/mpeg' };
    } else {
      data = blob;
    }
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

export async function getStoredAudioUrl(key) {
  try {
    const item = await getStoredAudio(key);
    if (!item) return null;
    let blob;
    if (item instanceof Blob) {
      blob = item;
    } else if (item?.buffer) {
      blob = new Blob([item.buffer], { type: item.type || 'audio/mpeg' });
    } else {
      return null;
    }
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      return URL.createObjectURL(blob);
    }
  } catch {
    return null;
  }
  return null;
}

export async function clearStoredAudio() {
  try {
    const db = await openAudioDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // ignore
  }
}

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
  if (activeWebSpeechTimer) {
    clearInterval(activeWebSpeechTimer);
    activeWebSpeechTimer = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
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
      modelId: "eleven_v4",
      languageCode: "ja",
      voiceSettings: {
        stability: 0.3,
        use_speaker_boost: true,
        similarity_boost: 1,
        style: 1,
        speed: -2,
        clone_strength: 0.6
      }
    }),
  });
}

export async function fetchElevenLabsAudio(text, { apiKey, voiceId, role = 'bot', skipCache = false } = {}) {
  const vid = stripQuotes(voiceId) || getElevenLabsVoiceId(role);
  const cacheKey = `${role}:${vid}:${text}`;

  if (!skipCache) {
    const storedUrl = await getStoredAudioUrl(cacheKey);
    if (storedUrl) {
      return storedUrl;
    }
  }

  let key = stripQuotes(apiKey);
  if (!key) {
    if (role === 'user') {
      key = stripQuotes(import.meta.env?.VITE_ELEVENLABS_USER_API_KEY) || stripQuotes(import.meta.env?.VITE_ELEVENLABS_API_KEY);
    } else {
      key = stripQuotes(import.meta.env?.VITE_ELEVENLABS_API_KEY);
    }
  }

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
    saveStoredAudio(cacheKey, blob).catch?.(() => {});
    return URL.createObjectURL(blob);
  }
  return null;
}

export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/(\[VN\]|【VN】|\(VN\))/gi, '')
    .replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\([^\w\s\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]*\)/gu, '')
    .trim();
}

export async function playBotSpeech(text, { onTimeUpdate, onEnded, onPlay, onPause } = {}) {
  if (!text) return;

  const speechText = cleanTextForSpeech(text) || text;

  stopElevenLabsAudio();

  if (hasElevenLabsKey('bot')) {
    try {
      const vid = getElevenLabsVoiceId('bot');
      const cacheKey = `bot:${vid}:${speechText}`;
      let url = audioCache.get(cacheKey);
      if (!url) {
        url = await getStoredAudioUrl(cacheKey);
        if (url) {
          audioCache.set(cacheKey, url);
        }
      }
      if (!url) {
        url = await fetchElevenLabsAudio(speechText, { role: 'bot', voiceId: vid });
        if (url) {
          audioCache.set(cacheKey, url);
        }
      }
      if (url && typeof Audio !== 'undefined') {
        const audio = new Audio(url);
        currentAudio = audio;

        const estimatedSec = Math.max(2, Math.round(speechText.length * 0.16));
        let knownDuration = estimatedSec;

        const updateDuration = () => {
          if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
            knownDuration = audio.duration;
          }
        };

        audio.onloadedmetadata = updateDuration;
        audio.ondurationchange = updateDuration;
        audio.oncanplay = updateDuration;

        // Blob MP3 in Chrome/WebKit often reports duration = Infinity.
        // Decode audio data via Web Audio API to obtain the exact duration.
        if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            fetch(url)
              .then(res => res.arrayBuffer())
              .then(buf => ctx.decodeAudioData(buf))
              .then(decoded => {
                if (decoded?.duration && isFinite(decoded.duration) && decoded.duration > 0) {
                  knownDuration = decoded.duration;
                }
                try { ctx.close?.(); } catch {}
              })
              .catch(() => {});
          } catch {}
        }

        if (onTimeUpdate) {
          audio.ontimeupdate = () => {
            updateDuration();
            const currentTime = audio.currentTime || 0;
            const duration = (audio.duration && isFinite(audio.duration) && audio.duration > 0)
              ? audio.duration
              : knownDuration;
            const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
            onTimeUpdate({
              currentTime,
              duration,
              progress,
            });
          };
        }
        audio.onended = () => {
          if (currentAudio === audio) currentAudio = null;
          const finalDuration = (audio.duration && isFinite(audio.duration) && audio.duration > 0)
            ? audio.duration
            : Math.max(audio.currentTime || 0, knownDuration);
          onTimeUpdate?.({
            currentTime: finalDuration,
            duration: finalDuration,
            progress: 1,
          });
          onEnded?.();
        };
        audio.onpause = () => {
          onPause?.();
        };
        audio.onplay = () => {
          onPlay?.();
        };
        await audio.play();
        return audio;
      }
    } catch (err) {
      console.warn('ElevenLabs bot TTS failed, falling back to Web Speech:', err);
    }
  }

  if (isSpeechSupported()) {
    const estimatedSec = Math.max(2, Math.round(text.length * 0.16));
    const start = Date.now();
    onPlay?.();
    activeWebSpeechTimer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(1, elapsed / estimatedSec);
      onTimeUpdate?.({
        currentTime: elapsed,
        duration: estimatedSec,
        progress,
      });
      if (progress >= 1) {
        if (activeWebSpeechTimer) {
          clearInterval(activeWebSpeechTimer);
          activeWebSpeechTimer = null;
        }
        onEnded?.();
      }
    }, 100);

    speak(speechText);
    return {
      pause: () => {
        stopElevenLabsAudio();
        onPause?.();
      }
    };
  }
}

export async function playUserSpeech(text) {
  if (!text) return;
  const speechText = cleanTextForSpeech(text) || text;

  if (hasElevenLabsKey('user')) {
    try {
      stopElevenLabsAudio();
      const vid = getElevenLabsVoiceId('user');
      const cacheKey = `user:${vid}:${speechText}`;
      let url = audioCache.get(cacheKey);
      if (!url) {
        url = await getStoredAudioUrl(cacheKey);
        if (url) {
          audioCache.set(cacheKey, url);
        }
      }
      if (!url) {
        url = await fetchElevenLabsAudio(speechText, { role: 'user', voiceId: vid });
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
    speak(speechText);
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

