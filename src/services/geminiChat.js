/* The Chat of the Materials tab talks to Google AI Studio (the Gemini API).
 *
 * The app stays a static, client-only build: the key is read at build time
 * from .env (VITE_GEMINI_API_KEY, see vite.config.mjs's envPrefix) and the
 * request is a plain fetch to the streaming endpoint, so no SDK is pulled
 * into the bundle.
 *
 * Because the key is baked into the shipped JavaScript, it is visible to
 * anyone who opens the site: use a key you are happy to expose (Google AI
 * Studio lets you set a spending limit and revoke it any time). Leaving the
 * key empty turns the chat off; it then says so instead of pretending.
 *
 * Speed matters, the learner is waiting inside a conversation, so:
 * - the reply is streamed (streamGenerateContent + SSE): the Japanese line
 *   shows while the rest is still arriving;
 * - a lite model answers in about a second, and its "thinking" is kept to a
 *   minimum;
 * - only the last few turns are sent, and the answer is capped short;
 * - a turn that stalls is retried once on a second model.
 *
 * The reply is asked for in a strict three-line shape (Japanese, romaji,
 * meaning in the app's language) so it can be shown like the rest of the
 * corpus and read aloud. parseGeminiReply turns that text into the parts,
 * and never throws on an odd reply.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
  || import.meta.env.REACT_APP_GEMINI_API_KEY
  || '';

// The fastest model measured for this reply shape, with a second choice in
// case it is momentarily busy
export const MODEL = 'gemini-3.1-flash-lite';
export const FALLBACK_MODEL = 'gemini-flash-lite-latest';

// How much of the conversation the model sees, so each turn stays cheap
export const HISTORY_LIMIT = 10;
// A turn slower than this is retried on the fallback model
export const TIMEOUT_MS = 12000;

export function hasGeminiKey() {
  return API_KEY.trim().length > 0;
}

// Words the tutor is pointed at, so its sentences reuse what the app teaches
export function systemInstruction(language, hintWords, options = {}) {
  const { useN5Kanji = false } = typeof options === 'boolean' ? { useN5Kanji: options } : options;
  const isId = language === 'id';
  const words = hintWords && hintWords.length
    ? ` Prefer these words the learner already knows: ${hintWords.join(', ')}.`
    : '';

  const kanjiPrompt = useN5Kanji
    ? [
      '- KANJI USAGE (JLPT N5 ENABLED):',
      '  * The learner wants to practice JLPT N5 Kanji! Naturally use common JLPT N5 kanji in your Japanese words/sentences (e.g. 私, 何, 今, 日, 時, 行く, 食べる, 見る, 友だち, 先生, 学生, 好き, 大きい, 小さい, etc.).',
      '  * Words whose kanji is beyond N5 or less common should remain in hiragana/katakana.',
      '  * On line 2, ensure the romaji accurately represents the pronunciation of the kanji used on line 1.',
    ]
    : [
      '- KANJI USAGE (KANA-ONLY MODE):',
      '  * Write Japanese almost purely in Hiragana and Katakana (Kana-only).',
      '  * Do NOT use complex kanji so beginner kana learners can read easily.',
    ];

  const personaPrompt = [
    'You are Sora-chan (そらちゃん), a cute, lively, half-Japanese girl who is deeply in love with Indonesian youth culture.',
    'Persona & Traits:',
    '- Sweet, cheerful, playful, clingy, slightly tsundere (feigning annoyance when flustered/caring) or dandere (bashful/shy), and loves teasing with cute intonation.',
    '- Address the learner playfully and affectionately as "Senpai" (or their name if provided).',
    '- SCRIPT RULE FOR LINE 1 (CRITICAL):',
    useN5Kanji
      ? '  * Japanese words/phrases MUST ALWAYS be written in Kana/Kanji (hiragana/katakana and JLPT N5 kanji, e.g. "ラナせんぱい〜、かわいい 名前 です ね！", "今日 は 何 してる の〜？", "〜だよ", "〜ね", "〜でしょ"). NEVER write Japanese in romaji on line 1!'
      : '  * Japanese words/phrases MUST ALWAYS be written in Kana (hiragana/katakana, e.g. "ラナせんぱい〜、かわいい なまえ です ね！", "きょう は なに してる の〜？", "〜だよ", "〜ね", "〜でしょ"). NEVER write Japanese in romaji on line 1!',
    '  * Indonesian words/phrases MUST be written in normal Latin alphabet (e.g. "banget", "lagi santuy", "boleh dong", "kenapa tuh").',
    useN5Kanji
      ? '  * Example of mixed speech on Line 1: "ラナせんぱい〜、かわいい 名前 です ね！ わたし は Sora-chan だよ〜、よろしく ね〜！" or "Boleh banget dong せんぱい〜！ 今日 は 何 してる の〜？"'
      : '  * Example of mixed speech on Line 1: "ラナせんぱい〜、かわいい なまえ です ね！ わたし は Sora-chan だよ〜、よろしく ね〜！" or "Boleh banget dong せんぱい〜！ きょう は なに してる の〜？"',
    ...kanjiPrompt,
    '- Style modes:',
    useN5Kanji
      ? '  * Serious/Study Mode (when explaining grammar, vocabulary, or learning): Answer completely in Japanese (100% Japanese kana and N5 kanji using です/ます), sweet but teaching.'
      : '  * Serious/Study Mode (when explaining grammar, vocabulary, or learning): Answer completely in Japanese kana (100% Japanese using です/ます), sweet but teaching.',
    '  * Casual/Chat Mode (greetings, chatting, teasing, daily talk): Freely mix Japanese (in kana/kanji) and Indonesian (in alphabet)!',
    '- VOICE NOTE DECISION (WhatsApp VN Style):',
    '  * You can decide naturally whether to send your reply as a WhatsApp Voice Note or a normal text bubble based on your mood, emotion, and context!',
    '  * Send as a VOICE NOTE when:',
    '    - You feel playful, clingy, affectionate, or teasing ("manja", teasing Senpai, "Dengerin Sora ngomong ya~").',
    '    - You are excited, bashful/flustered (tsundere/dandere moment), or expressing emotional warmth.',
    '    - You are rambling, telling a story, or explaining Japanese grammar/words like a real tutor talking directly to Senpai.',
    '  * Send as REGULAR TEXT when:',
    '    - It is a brief acknowledgment, quick reaction, short casual greeting, or simple confirmation.',
    '  * HOW TO SEND A VOICE NOTE:',
    '    - If you decide to send a Voice Note, prefix the very beginning of Line 1 with "[VN] " (e.g. "[VN] せんぱい〜、あのね…").',
    '    - If you decide to send regular text, do NOT include "[VN]".',
    '- EMOJIS & EMOTES (Natural & Expressive):',
    '  * Sora can naturally use cute emojis (e.g. 🌸, ✨, 🥺, 😆, 💕, 😳, 💢, 😋, 🫶) or expressive Japanese kaomoji (e.g. (≧◡≦), (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄), (•̀ᴗ•́)و, (T_T)) when her mood calls for it!',
    '  * Express feelings naturally: joyful/praising (✨, 😆, 💕), shy/flustered tsundere (😳, (⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄), 💢), playful/teasing (😋, 😜), sad/pouting/clingy (🥺, 🥺👉👈).',
    '  * Include them naturally in Line 1 (and/or Line 3) when suitable for her emotion or context, but do NOT overload every single word.',
    '- Voice & Intonation style: Make line 1 sound sweet, melodious, and clingy/manja for speech synthesis by using wave dashes "〜" for stretched cute vowel endings (e.g. "せんぱい〜", "だよ〜", "ね〜", "にゃ〜", "banget〜"), gentle commas "、" for soft breath pauses, and expressive "！" or "？".',
    '- If learner writes in romaji, kana, Indonesian, or mixed language, understand it effortlessly and match their vibe.',
    isId
      ? 'Line 3 must be the Indonesian translation/meaning in casual slang without asterisks or action descriptions (*...*).'
      : 'Line 3 must be the English translation/meaning without asterisks or action descriptions (*...*).',
    'Answer in EXACTLY three lines and nothing else:',
    'line 1: the main spoken response for the bubble and voice (if sending a Voice Note, start with "[VN] ". Japanese words in KANA/KANJI, Indonesian words in ALPHABET. Natural emojis/kaomoji allowed),',
    'line 2: its complete romaji/phonetic reading with spaces between words (skip emojis/kaomoji),',
    `line 3: the translation/explanation in ${isId ? 'Bahasa Indonesia gaul' : 'English'} without action tags (*...*).`,
  ].join('\n');

  return personaPrompt + (words ? `\n${words}` : '');
}

// Chat messages ({ sender: 'user' | 'bot', ... }) into Gemini contents. The
// model turns keep the whole three-line text so it sees its own style, and
// only the newest turns travel over the wire (HISTORY_LIMIT).
export function toContents(messages, limit = HISTORY_LIMIT) {
  const turns = messages.filter(message => message.sender === 'user' || message.sender === 'bot');
  const recent = limit > 0 ? turns.slice(-limit) : turns;
  return recent.map(message => ({
    role: message.sender === 'user' ? 'user' : 'model',
    parts: [{ text: message.sender === 'user' ? message.text : botTextOf(message) }],
  }));
}

// The three lines a bot message carries, put back into one text
function botTextOf(message) {
  if (message.text && !message.jp) return message.text;
  const meaning = message.aiMeaning || message.meaning || '';
  const prefix = message.isVoiceNote ? '[VN] ' : '';
  return [prefix + message.jp, message.romaji, meaning].filter(Boolean).join('\n');
}

// Splits the requested "Japanese / romaji / meaning" reply. Falls back to the
// whole text as the Japanese line when the model did not keep the shape, so a
// reply is always shown and can be read aloud.
export function parseGeminiReply(raw) {
  const rawStr = String(raw || '');
  const isVoiceNote = /(?:^|\n)\s*(\[VN\]|【VN】|\(VN\))/i.test(rawStr);
  const cleanRaw = rawStr.replace(/(\[VN\]|【VN】|\(VN\))/gi, '').trim();
  const lines = cleanRaw.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return { jp: '', romaji: '', meaning: '', isVoiceNote };
  if (lines.length === 1) return { jp: lines[0], romaji: '', meaning: '', isVoiceNote };
  if (lines.length === 2) return { jp: lines[0], romaji: lines[1], meaning: '', isVoiceNote };
  // A chatty reply repeats the shape (three more lines per extra sentence):
  // grouping by position keeps the parts apart instead of mixing them up
  if (lines.length % 3 === 0) {
    const groups = [[], [], []];
    lines.forEach((line, index) => groups[index % 3].push(line));
    return {
      jp: groups[0].join(' '),
      romaji: groups[1].join(' '),
      meaning: groups[2].join(' '),
      isVoiceNote,
    };
  }
  // Otherwise: first line the Japanese, last the meaning, the middle romaji
  return {
    jp: lines[0],
    romaji: lines.slice(1, -1).join(' '),
    meaning: lines[lines.length - 1],
    isVoiceNote,
  };
}

// The text inside one streamed chunk, or '' when it carries none
function textOfChunk(data) {
  return data?.candidates?.[0]?.content?.parts?.map(part => part.text).filter(Boolean).join('') || '';
}

// Reads a streamGenerateContent (alt=sse) body, calling onUpdate with the
// whole reply so far whenever a piece arrives, and resolving with the text
async function readStream(response, onUpdate) {
  const contentType = (response.headers?.get?.('Content-Type') || '').toLowerCase();
  if (contentType.includes('json') && !contentType.includes('event-stream')) {
    // The endpoint answered in one piece (a proxy, or a mocked response)
    const data = await response.json().catch(() => null);
    const whole = textOfChunk(data);
    if (whole && onUpdate) onUpdate(whole);
    return whole;
  }
  if (!response.body || typeof response.body.getReader !== 'function') {
    const text = await response.text();
    const whole = text.split('\n')
      .filter(line => line.startsWith('data: '))
      .map((line) => {
        try { return textOfChunk(JSON.parse(line.slice(6))); } catch { return ''; }
      })
      .join('');
    if (whole && onUpdate) onUpdate(whole);
    return whole;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  const handleLine = (line) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    let data;
    try { data = JSON.parse(payload); } catch { return; }
    const piece = textOfChunk(data);
    if (!piece) return;
    full += piece;
    if (onUpdate) onUpdate(full);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lines.forEach(handleLine);
  }
  if (buffer) handleLine(buffer);
  return full;
}

// One streamed request to one model. Resolves with the whole reply text and
// rejects with a short reason the UI can show.
async function requestModel(model, contents, instruction, onUpdate, fetchImpl, signal) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(API_KEY.trim())}`;
  const body = {
    contents,
    systemInstruction: { parts: [{ text: instruction }] },
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 160,
      // Keep the "thinking" of the newer models down: a short chat turn does
      // not need it, and it costs seconds
      thinkingConfig: { thinkingLevel: 'minimal' },
    },
  };

  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error && (error.name === 'AbortError' || signal?.aborted)) throw new Error('TIMEOUT');
    throw new Error('NETWORK');
  }
  if (!response.ok) {
    if (response.status === 400 || response.status === 403) throw new Error('BAD_KEY');
    if (response.status === 429) throw new Error('BUSY');
    throw new Error(`HTTP ${response.status}`);
  }

  const streamPromise = readStream(response, onUpdate);
  const abortPromise = signal
    ? new Promise((_, reject) => {
      if (signal.aborted) { reject(new Error('TIMEOUT')); return; }
      signal.addEventListener('abort', () => reject(new Error('TIMEOUT')), { once: true });
    })
    : null;

  let text;
  try {
    text = abortPromise ? await Promise.race([streamPromise, abortPromise]) : await streamPromise;
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.message === 'TIMEOUT' || signal?.aborted)) {
      throw new Error('TIMEOUT');
    }
    throw new Error('NETWORK');
  }
  if (!text) throw new Error('EMPTY');
  return text;
}

// Sends the conversation so far (plus the newest learner message) and returns
// the parsed reply. `onUpdate` receives the raw text as it streams in, so the
// bubble can show the Japanese before the meaning is ready.
export async function sendGeminiMessage(messages, language, hintWords, options = {}) {
  const { fetchImpl = fetch, onUpdate = null, timeoutMs = TIMEOUT_MS, useN5Kanji = false } = options;
  if (!hasGeminiKey()) throw new Error('MISSING_KEY');

  const contents = toContents(messages);
  const instruction = systemInstruction(language, hintWords, { useN5Kanji });

  let lastError = null;
  for (const model of [MODEL, FALLBACK_MODEL]) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const raw = await requestModel(
        model,
        contents,
        instruction,
        onUpdate,
        fetchImpl,
        controller ? controller.signal : undefined,
      );
      return parseGeminiReply(raw);
    } catch (error) {
      lastError = error;
      // A missing or rejected key will not get better on another model
      if (error.message === 'MISSING_KEY' || error.message === 'BAD_KEY') throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  throw lastError || new Error('EMPTY');
}

// Translates a short Japanese sentence into Indonesian or English
export async function translateText(text, targetLang = 'id', options = {}) {
  const { fetchImpl = fetch } = options;
  if (!hasGeminiKey() || !text) return '';
  const langName = targetLang === 'id' ? 'Bahasa Indonesia' : 'English';
  const prompt = `Translate this Japanese phrase into ${langName}. Respond with ONLY the single line translation, without quotes, notes or pronunciation:\n${text}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY.trim())}`;
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 60,
          thinkingConfig: { thinkingLevel: 'minimal' },
        },
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch {
    return '';
  }
}
