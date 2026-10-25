import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  hasElevenLabsKey,
  getElevenLabsVoiceId,
  fetchElevenLabsAudio,
  playBotSpeech,
  playUserSpeech,
  stopElevenLabsAudio,
  clearElevenLabsCache,
} from './elevenlabs.js';
import * as speechModule from '../speech.js';

vi.mock('../speech.js', () => ({
  speak: vi.fn(),
  isSpeechSupported: vi.fn(() => true),
}));

describe('elevenlabs service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearElevenLabsCache();
    delete import.meta.env.VITE_ELEVENLABS_API_KEY;
    delete import.meta.env.VITE_ELEVENLABS_VOICE_ID;
    delete import.meta.env.VITE_ELEVENLABS_USER_API_KEY;
    delete import.meta.env.VITE_ELEVENLABS_USER_VOICE_ID;
  });

  test('hasElevenLabsKey checks VITE_ELEVENLABS_API_KEY and role keys', () => {
    expect(hasElevenLabsKey('bot')).toBe(false);
    expect(hasElevenLabsKey('user')).toBe(false);

    import.meta.env.VITE_ELEVENLABS_API_KEY = 'bot-key';
    expect(hasElevenLabsKey('bot')).toBe(true);
    expect(hasElevenLabsKey('user')).toBe(true); // falls back to general key

    import.meta.env.VITE_ELEVENLABS_USER_API_KEY = 'user-key';
    expect(hasElevenLabsKey('user')).toBe(true);
  });

  test('getElevenLabsVoiceId returns custom voice or default for bot and user', () => {
    expect(getElevenLabsVoiceId('bot')).toBe('EXAVITQu4vr4xnSDxMaL');
    expect(getElevenLabsVoiceId('user')).toBe('r6PXps8L8e51YofYDNqb');

    import.meta.env.VITE_ELEVENLABS_VOICE_ID = 'bot-voice-123';
    import.meta.env.VITE_ELEVENLABS_USER_VOICE_ID = 'user-voice-456';
    expect(getElevenLabsVoiceId('bot')).toBe('bot-voice-123');
    expect(getElevenLabsVoiceId('user')).toBe('user-voice-456');
  });

  test('fetchElevenLabsAudio makes POST request with correct headers and payload', async () => {
    const mockBlob = new Blob(['mock audio'], { type: 'audio/mpeg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-audio');

    const result = await fetchElevenLabsAudio('こんにちは', {
      apiKey: 'secret-key',
      voiceId: 'voice-abc',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/voice-abc',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': 'secret-key',
        },
      })
    );
    expect(result).toBe('blob:http://localhost/mock-audio');
  });

  test('fetchElevenLabsAudio retries with premade voice when HTTP 402 is returned', async () => {
    const mockBlob = new Blob(['mock audio'], { type: 'audio/mpeg' });
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 402,
        text: () => Promise.resolve('Free users cannot use library voices'),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fallback-audio');

    const result = await fetchElevenLabsAudio('こんにちは', {
      apiKey: 'user-key',
      voiceId: 'r6PXps8L8e51YofYDNqb',
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.elevenlabs.io/v1/text-to-speech/IKne3meq5aSn9XLyUdCD',
      expect.anything()
    );
    expect(result).toBe('blob:http://localhost/fallback-audio');
  });

  test('fetchElevenLabsAudio throws on non-ok HTTP status when fallback also fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid API key'),
    });

    await expect(
      fetchElevenLabsAudio('test', { apiKey: 'bad-key' })
    ).rejects.toThrow('ELEVENLABS_HTTP_401');
  });

  test('playBotSpeech falls back to Web Speech when no ElevenLabs key is configured', async () => {
    const speakSpy = vi.spyOn(speechModule, 'speak');
    await playBotSpeech('こんにちは');
    expect(speakSpy).toHaveBeenCalledWith('こんにちは');
  });

  test('playUserSpeech falls back to Web Speech when no ElevenLabs key is configured', async () => {
    const speakSpy = vi.spyOn(speechModule, 'speak');
    await playUserSpeech('ありがとう');
    expect(speakSpy).toHaveBeenCalledWith('ありがとう');
  });

  test('playUserSpeech uses user key and voice when configured', async () => {
    import.meta.env.VITE_ELEVENLABS_USER_API_KEY = 'user-key-789';
    import.meta.env.VITE_ELEVENLABS_USER_VOICE_ID = 'r6PXps8L8e51YofYDNqb';

    const mockBlob = new Blob(['user audio'], { type: 'audio/mpeg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/user-audio');

    const playMock = vi.fn().mockResolvedValue();
    globalThis.Audio = vi.fn().mockImplementation(() => ({
      play: playMock,
      pause: vi.fn(),
      currentTime: 0,
      onended: null,
    }));

    await playUserSpeech('ありがとう');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/r6PXps8L8e51YofYDNqb',
      expect.objectContaining({
        headers: expect.objectContaining({
          'xi-api-key': 'user-key-789',
        }),
      })
    );
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  test('playBotSpeech uses ElevenLabs and Audio when key is present', async () => {
    import.meta.env.VITE_ELEVENLABS_API_KEY = 'test-key';
    const mockBlob = new Blob(['mock audio'], { type: 'audio/mpeg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-audio');

    const playMock = vi.fn().mockResolvedValue();
    globalThis.Audio = vi.fn().mockImplementation(() => ({
      play: playMock,
      pause: vi.fn(),
      currentTime: 0,
      onended: null,
    }));

    await playBotSpeech('こんにちは');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(playMock).toHaveBeenCalledTimes(1);

    // Repeating the same text should use cache and not fetch again
    await playBotSpeech('こんにちは');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
