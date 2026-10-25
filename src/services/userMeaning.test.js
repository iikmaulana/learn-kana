import { describe, test, expect, beforeEach } from 'vitest';
import {
  lookupUserMeaning,
  resolveUserMeaning,
  clearUserMeaningCache,
} from './userMeaning.js';

describe('userMeaning service', () => {
  beforeEach(() => {
    clearUserMeaningCache();
  });

  test('lookups common greetings and replies in Indonesian and English', () => {
    expect(lookupUserMeaning('こんにちは', 'id')).toContain('Halo');
    expect(lookupUserMeaning('こんにちは', 'en')).toContain('Hello');
    expect(lookupUserMeaning('はい、そうです', 'id')).toBe('Ya, benar');
    expect(lookupUserMeaning('わかりません', 'id')).toBe('Saya tidak mengerti');
    expect(lookupUserMeaning('ありがとう', 'id')).toBe('Terima kasih');
  });

  test('matches patterns like わたしは [name] です', () => {
    expect(lookupUserMeaning('わたしはたろうです', 'id')).toBe('Saya adalah たろう');
    expect(lookupUserMeaning('わたしはたろうです', 'en')).toBe('I am たろう');
  });

  test('matches patterns like [item] がすきです', () => {
    expect(lookupUserMeaning('にほんがすきです', 'id')).toBe('Saya suka にほん');
  });

  test('resolveUserMeaning falls back to local dictionary without API call', async () => {
    const res = await resolveUserMeaning('げんきです', 'id');
    expect(res).toContain('kabar baik');
  });
});
