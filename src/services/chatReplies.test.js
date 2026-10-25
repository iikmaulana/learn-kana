import { describe, expect, it } from 'vitest';
import { isJapaneseQuestion, getQuickRepliesForQuestion } from './chatReplies';

describe('chatReplies service', () => {
  describe('isJapaneseQuestion', () => {
    it('detects explicit question marks (? and ？)', () => {
      expect(isJapaneseQuestion('おなまえは？')).toBe(true);
      expect(isJapaneseQuestion('どこにいくの?')).toBe(true);
      expect(isJapaneseQuestion('すきな たべものは なに〜？')).toBe(true);
    });

    it('detects prompting requests (おしえて, きかせて)', () => {
      expect(isJapaneseQuestion('すきな こと、おしえて〜！')).toBe(true);
      expect(isJapaneseQuestion('おすすめのアニメを 教えてください')).toBe(true);
      expect(isJapaneseQuestion('きかせてね！')).toBe(true);
    });

    it('detects polite and casual question endings (ですか, ますか, かい, etc.)', () => {
      expect(isJapaneseQuestion('げんきですか')).toBe(true);
      expect(isJapaneseQuestion('ごはんを たべますか！')).toBe(true);
      expect(isJapaneseQuestion('知ってるかい')).toBe(true);
      expect(isJapaneseQuestion('わかるのかな')).toBe(true);
      expect(isJapaneseQuestion('いいでしょうか')).toBe(true);
    });

    it('detects informal question particles and question words', () => {
      expect(isJapaneseQuestion('どこから きたの')).toBe(true);
      expect(isJapaneseQuestion('きょうの きぶんは どう')).toBe(true);
      expect(isJapaneseQuestion('すきな ものは なに')).toBe(true);
    });

    it('returns false for non-questions (statements, compliments, greetings)', () => {
      expect(isJapaneseQuestion('こんにちは！')).toBe(false);
      expect(isJapaneseQuestion('すごいですね、せんぱい！')).toBe(false);
      expect(isJapaneseQuestion('ありがとうございます！')).toBe(false);
      expect(isJapaneseQuestion('わたしは ソラです。')).toBe(false);
      expect(isJapaneseQuestion('きょうも いっしょに がんばりましょう！')).toBe(false);
      expect(isJapaneseQuestion('また あした ね！')).toBe(false);
      expect(isJapaneseQuestion('にほんごが じょうずですね〜')).toBe(false);
      expect(isJapaneseQuestion('')).toBe(false);
      expect(isJapaneseQuestion(null)).toBe(false);
    });
  });

  describe('getQuickRepliesForQuestion', () => {
    it('returns empty array when AI message is not a question', () => {
      expect(getQuickRepliesForQuestion('すごいですね、せんぱい！')).toEqual([]);
      expect(getQuickRepliesForQuestion('ありがとうございます！')).toEqual([]);
      expect(getQuickRepliesForQuestion('また あした ね！')).toEqual([]);
      expect(getQuickRepliesForQuestion('')).toEqual([]);
      expect(getQuickRepliesForQuestion(null)).toEqual([]);
    });

    it('returns food replies for food questions', () => {
      const replies = getQuickRepliesForQuestion('すきな たべものは なに〜？おしえて〜！');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('ラーメンが すきです');
      expect(replies[1].jp).toBe('すしを たべたいです');
    });

    it('returns anime replies for anime questions', () => {
      const replies = getQuickRepliesForQuestion('すきな アニメとか ある〜？');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('アニメが だいすきです！');
      expect(replies[1].jp).toBe('ナルトや ワンピースが すきです');
    });

    it('returns reason replies when asked why studying Japanese', () => {
      const replies = getQuickRepliesForQuestion('どうして にほんごを べんきょう してるの〜？');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('にほんへ いきたいからです');
      expect(replies[1].jp).toBe('アニメを みるためです');
    });

    it('returns name replies for name questions', () => {
      const replies = getQuickRepliesForQuestion('ヤッホー、せんぱい〜！おなまえは、なんですか〜？');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('わたしは [なまえ] です');
    });

    it('returns origin replies for where questions', () => {
      const replies = getQuickRepliesForQuestion('どこから きたの〜？');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('インドネシアからです');
    });

    it('returns mood replies for condition/mood questions', () => {
      const replies = getQuickRepliesForQuestion('きょうの きぶんは どう〜？');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('はい、げんきいっぱいです！');
    });

    it('returns hobby replies for general hobby/likes questions', () => {
      const replies = getQuickRepliesForQuestion('しゅみは なんですか〜？すきな こと、おしえて〜！');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('おんがくを きくことです');
    });

    it('returns weather replies for weather questions', () => {
      const replies = getQuickRepliesForQuestion('きょうの てんきは どうですか？');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('とても いい てんきです');
    });

    it('returns fallback replies for general yes/no or unknown questions', () => {
      const replies = getQuickRepliesForQuestion('これを しっていますか？');
      expect(replies).toHaveLength(3);
      expect(replies[0].jp).toBe('はい、わかりました！');

      const generalReplies = getQuickRepliesForQuestion('ほんとうですか？');
      expect(generalReplies).toHaveLength(3);
      expect(generalReplies[0].jp).toBe('はい、そうです！');
    });
  });
});
