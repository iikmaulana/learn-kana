import {
  hasGeminiKey,
  systemInstruction,
  toContents,
  parseGeminiReply,
  sendGeminiMessage,
  MODEL,
  FALLBACK_MODEL,
  HISTORY_LIMIT,
} from './geminiChat.js';

/* The Gemini service is tested without the network: a fake fetch answers with
 * the SSE shape of streamGenerateContent, so the streaming reader, the model
 * fallback and the timeouts all run for real.
 */

// An SSE body out of the given reply text, in a few chunks
function sseResponse(texts, { ok = true, status = 200 } = {}) {
  const encoder = new TextEncoder();
  let index = 0;
  const body = {
    getReader() {
      return {
        read() {
          if (index >= texts.length) return Promise.resolve({ done: true, value: undefined });
          const payload = `data: ${JSON.stringify({
            candidates: [{ content: { parts: [{ text: texts[index] }] } }],
          })}\n\n`;
          index += 1;
          return Promise.resolve({ done: false, value: encoder.encode(payload) });
        },
      };
    },
  };
  return Promise.resolve({
    ok,
    status,
    headers: { get: () => 'text/event-stream' },
    body,
  });
}

const threeLines = ['はじめまして。\n', 'hajimemashite.\n', 'Salam kenal.'];

describe('Gemini chat service', () => {
  test('hasGeminiKey returns a boolean', () => {
    expect(typeof hasGeminiKey()).toBe('boolean');
  });

  describe('systemInstruction', () => {
    test('mentions JLPT polite forms and the three-line response shape', () => {
      const instruction = systemInstruction('en', ['ほん', 'ねこ']);
      expect(instruction).toContain('polite beginner Japanese');
      expect(instruction).toContain('EXACTLY three lines');
      expect(instruction).toContain('ほん, ねこ');
    });

    test('specifies Indonesian meaning when language is id', () => {
      expect(systemInstruction('id')).toContain('Bahasa Indonesia');
    });
  });

  describe('toContents', () => {
    test('converts user and bot turns into Gemini contents format', () => {
      const messages = [
        { sender: 'bot', jp: 'こんにちは', romaji: 'konnichiwa', aiMeaning: 'Hello' },
        { sender: 'user', text: 'genki desu' },
      ];
      const contents = toContents(messages);
      expect(contents).toHaveLength(2);
      expect(contents[0].role).toBe('model');
      expect(contents[0].parts[0].text).toBe('こんにちは\nkonnichiwa\nHello');
      expect(contents[1].role).toBe('user');
      expect(contents[1].parts[0].text).toBe('genki desu');
    });

    test('keeps only the newest turns, so a reply stays quick', () => {
      const messages = Array.from({ length: HISTORY_LIMIT + 6 }, (_, i) => ({
        sender: i % 2 ? 'user' : 'bot',
        text: `turn ${i}`,
        jp: `jp ${i}`,
      }));
      const contents = toContents(messages);
      expect(contents).toHaveLength(HISTORY_LIMIT);
      expect(contents[contents.length - 1].parts[0].text).toContain(`turn ${messages.length - 1}`);
    });
  });

  describe('parseGeminiReply', () => {
    test('splits clean three-line reply', () => {
      const parsed = parseGeminiReply('はい、そうです\nhai, sou desu\nYes, that is right');
      expect(parsed).toEqual({ jp: 'はい、そうです', romaji: 'hai, sou desu', meaning: 'Yes, that is right' });
    });

    test('keeps two sentences of the same shape apart', () => {
      const parsed = parseGeminiReply([
        'はじめまして。', 'hajimemashite.', 'Salam kenal.',
        'げんきですか。', 'genki desu ka.', 'Apa kabar?',
      ].join('\n'));
      expect(parsed.jp).toBe('はじめまして。 げんきですか。');
      expect(parsed.romaji).toBe('hajimemashite. genki desu ka.');
      expect(parsed.meaning).toBe('Salam kenal. Apa kabar?');
    });

    test('handles multi-line romaji', () => {
      const parsed = parseGeminiReply('これはほんです\nkore wa\nhon desu\nThis is a book');
      expect(parsed.jp).toBe('これはほんです');
      expect(parsed.romaji).toBe('kore wa hon desu');
      expect(parsed.meaning).toBe('This is a book');
    });

    test('handles single line gracefully', () => {
      const parsed = parseGeminiReply('こんにちは');
      expect(parsed).toEqual({ jp: 'こんにちは', romaji: '', meaning: '' });
    });

    test('handles empty reply gracefully', () => {
      expect(parseGeminiReply('').jp).toBe('');
    });
  });

  describe('sendGeminiMessage', () => {
    test('throws MISSING_KEY when no key is set', async () => {
      if (!hasGeminiKey()) {
        await expect(sendGeminiMessage([{ sender: 'user', text: 'hi' }], 'en'))
          .rejects.toThrow('MISSING_KEY');
      }
    });

    test('streams the reply and reports it as it arrives', async () => {
      if (!hasGeminiKey()) return;
      const seen = [];
      const fetchImpl = () => sseResponse(threeLines);
      const parsed = await sendGeminiMessage(
        [{ sender: 'user', text: 'konnichiwa' }],
        'id',
        null,
        { fetchImpl, onUpdate: raw => seen.push(raw) },
      );

      expect(parsed).toEqual({ jp: 'はじめまして。', romaji: 'hajimemashite.', meaning: 'Salam kenal.' });
      // The learner sees the Japanese before the meaning is finished
      expect(seen[0]).toContain('はじめまして。');
      expect(seen[seen.length - 1]).toBe(threeLines.join(''));
    });

    test('asks the fast model with thinking kept minimal', async () => {
      if (!hasGeminiKey()) return;
      let asked = null;
      const fetchImpl = (url, init) => {
        asked = { url, body: JSON.parse(init.body) };
        return sseResponse(threeLines);
      };
      await sendGeminiMessage([{ sender: 'user', text: 'konnichiwa' }], 'en', null, { fetchImpl });

      expect(asked.url).toContain(`models/${MODEL}:streamGenerateContent`);
      expect(asked.body.generationConfig.thinkingConfig.thinkingLevel).toBe('minimal');
      expect(asked.body.systemInstruction.parts[0].text).toContain('EXACTLY three lines');
    });

    test('retries once on the fallback model when the first one stalls', async () => {
      if (!hasGeminiKey()) return;
      const urls = [];
      const fetchImpl = (url) => {
        urls.push(url);
        // First model: a body that never finishes, so the timeout fires
        if (urls.length === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: { get: () => 'text/event-stream' },
            body: { getReader: () => ({ read: () => new Promise(() => {}) }) },
          });
        }
        return sseResponse(threeLines);
      };

      const parsed = await sendGeminiMessage(
        [{ sender: 'user', text: 'konnichiwa' }],
        'en',
        null,
        { fetchImpl, timeoutMs: 30 },
      );

      expect(urls).toHaveLength(2);
      expect(urls[1]).toContain(`models/${FALLBACK_MODEL}:streamGenerateContent`);
      expect(parsed.jp).toBe('はじめまして。');
    });

    test('rejects a bad key without trying the fallback', async () => {
      if (!hasGeminiKey()) return;
      const urls = [];
      const fetchImpl = (url) => {
        urls.push(url);
        return Promise.resolve({ ok: false, status: 403, headers: { get: () => '' } });
      };
      await expect(sendGeminiMessage([{ sender: 'user', text: 'hi' }], 'en', null, { fetchImpl }))
        .rejects.toThrow('BAD_KEY');
      expect(urls).toHaveLength(1);
    });

    test('handles network failure with a custom fetch', async () => {
      if (!hasGeminiKey()) return;
      const mockFetch = () => Promise.reject(new Error('Failed to fetch'));
      await expect(sendGeminiMessage([{ sender: 'user', text: 'hi' }], 'en', [], { fetchImpl: mockFetch }))
        .rejects.toThrow('NETWORK');
    });
  });
});
