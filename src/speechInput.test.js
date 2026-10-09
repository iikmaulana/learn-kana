import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InGameCharacterShowAndInput from './components/InGameCharacterShowAndInput';
import { sentences } from './sentences.js';
import { kanaCharacters } from './kanaCharacters.js';
import {
  getSpeechRecognitionClass,
  isSubsequence,
  japaneseToRomaji,
  matchSpokenAnswer,
  spokenFormOfReading,
} from './speechInput';

/*
 * The mic button only exists in sentence (long) practice. Pinning the group
 * selection to the groups of これは水です makes it the only sentence that can
 * be shown, which keeps every expectation deterministic.
 */
const SENTENCE_ENTRY = sentences.find(entry => entry.jp_character === 'これは水です');
const SENTENCE_JP = SENTENCE_ENTRY.jp_character;
// The accepted answers contain spaces for readability; players may type
// with or without them, so the tests type the space-less form
const SENTENCE_ROMANJI = SENTENCE_ENTRY.romanji[0].replace(/ /g, '');
const SENTENCE_GROUPS = ['か', 'ら', 'は', 'だ', 'さ', kanjiGroupOf('水')];

// The kanji group a character is taught in (e.g. 水 -> "N5 Nature")
function kanjiGroupOf(character) {
  return Object.values(kanaCharacters.kanji)
    .find(group => Object.values(group.characters).some(item => item.jp_character === character))?.title;
}

// The game only shows words whose kana groups are all selected; アイス is the
// only word built from the groups ア and サ, so selecting those two pins it
const WORD = Object.values(kanaCharacters.words).find(word => word.jp_character === 'アイス');
const WORD_GROUPS = [...WORD.katakana_groups, ...WORD.hiragana_groups];

// The game reads and writes its answer through direct DOM access, so the
// tests query the same elements the players see.
const displayedCharacter = () => document.querySelector('#in-game-kana-character > p').textContent;
const cursorGroup = () => document.querySelector('#in-game-text-input-cursor-group');
const beforeCursor = () => document.querySelector('#in-game-text-input-before-cursor');
const micButton = () => document.querySelector('#in-game-mic-button');
const nextButton = () => document.querySelector('#in-game-next-button');
const score = () => document.getElementById('in-game-score');
const sentenceStats = () => (JSON.parse(localStorage.getItem('userStats')) || {})[SENTENCE_JP];

class MockSpeechRecognition {
  static instances = [];

  constructor() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.aborted = false;
    MockSpeechRecognition.instances.push(this);
  }

  start() { this.started = true; }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }

  emitFinal(transcript) {
    this.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript } }],
    });
  }

  emitError(error) {
    this.onerror?.({ error });
  }
}

// The hidden input exists for mobile keyboards; desktop typing arrives as
// window keydown events, which is what a desktop player produces as well.
function pressKeys(...keys) {
  keys.forEach(key => fireEvent.keyDown(window, { key }));
}

function setSentencePracticeStorage() {
  localStorage.setItem('checkedKanas', JSON.stringify(SENTENCE_GROUPS));
  localStorage.setItem('game-mode-practice', 'long');
  localStorage.setItem('game-mode-word', 'false');
  localStorage.setItem('game-mode-touch', 'false');
  localStorage.setItem('game-mode-auto-next', 'false');
  localStorage.setItem('gameMode', JSON.stringify({ type: 'kana-selector', value: -1 }));
  localStorage.setItem('userStats', '{}');
}

function setWordPracticeStorage() {
  localStorage.setItem('checkedKanas', JSON.stringify(WORD_GROUPS));
  localStorage.setItem('game-mode-practice', 'words');
  localStorage.setItem('game-mode-word', 'true');
  localStorage.setItem('game-mode-touch', 'false');
  localStorage.setItem('game-mode-auto-next', 'false');
  localStorage.setItem('gameMode', JSON.stringify({ type: 'kana-selector', value: -1 }));
  localStorage.setItem('userStats', '{}');
}

async function renderPractice(setStorage) {
  setStorage();
  // The first character is loaded asynchronously when the game mounts
  await act(async () => {
    render(
      <MemoryRouter>
        <InGameCharacterShowAndInput />
      </MemoryRouter>
    );
  });
}

async function tapNextButton() {
  await act(async () => {
    fireEvent.click(nextButton());
  });
}

function lastRecognition() {
  return MockSpeechRecognition.instances[MockSpeechRecognition.instances.length - 1];
}

beforeEach(() => {
  localStorage.clear();
  MockSpeechRecognition.instances = [];
  window.SpeechRecognition = MockSpeechRecognition;
});

afterEach(() => {
  delete window.SpeechRecognition;
  jest.useRealTimers();
});

describe('speechInput utils', () => {
  test('getSpeechRecognitionClass finds the prefixed and unprefixed API', () => {
    delete window.SpeechRecognition;
    expect(getSpeechRecognitionClass()).toBeNull();
    window.webkitSpeechRecognition = MockSpeechRecognition;
    expect(getSpeechRecognitionClass()).toBe(MockSpeechRecognition);
    delete window.webkitSpeechRecognition;
  });

  test('japaneseToRomaji converts kana like the answers are written', () => {
    expect(japaneseToRomaji('わたし')).toBe('watashi');
    expect(japaneseToRomaji('アイス')).toBe('aisu');
    expect(japaneseToRomaji('ビール')).toBe('biiru');
    expect(japaneseToRomaji('きょう')).toBe('kyou');
    expect(japaneseToRomaji('がっこう')).toBe('gakkou');
    expect(japaneseToRomaji('')).toBe('');
    expect(japaneseToRomaji(null)).toBe('');
  });

  test('japaneseToRomaji drops kanji the recognizer may insert', () => {
    expect(japaneseToRomaji('私は学生です')).toBe('hadesu');
    expect(japaneseToRomaji('アイス。')).toBe('aisu');
  });

  test('isSubsequence checks order, not just characters', () => {
    expect(isSubsequence('hadesu', 'watashiwagakuseidesu')).toBe(true);
    expect(isSubsequence('sudah', 'watashiwagakuseidesu')).toBe(false);
    expect(isSubsequence('', 'abc')).toBe(false);
  });

  test('spokenFormOfReading swaps written particles for how they are spoken', () => {
    expect(spokenFormOfReading('kore wa mizu desu')).toBe('korehamizudesu');
    expect(spokenFormOfReading('gakkou e ikimasu')).toBe('gakkouheikimasu');
    expect(spokenFormOfReading('ocha o nomimasu')).toBe('ochawonomimasu');
    expect(spokenFormOfReading('ocha wo nomimasu')).toBe('ochawonomimasu');
    expect(spokenFormOfReading('watashi wa gakusei desu')).toBe('watashihagakuseidesu');
  });

  test('matchSpokenAnswer prefers exact matches and rejects near-empty speech', () => {
    const answers = ['aisu', 'koora'];
    expect(matchSpokenAnswer('aisu', answers)).toBe(0);
    expect(matchSpokenAnswer('ai', ['aisu'])).toBe(-1);
    expect(matchSpokenAnswer('', ['aisu'])).toBe(-1);
    // A dropped word still counts when more than half of the answer remains
    expect(matchSpokenAnswer('gakkouniikimasu', ['watashiwagakkouniikimasu'])).toBe(0);
    // ...but barely any speech does not
    expect(matchSpokenAnswer('desu', ['watashiwagakuseidesu'])).toBe(-1);
    expect(matchSpokenAnswer('ikimasu', ['watashiwagakkouniikimasu'])).toBe(-1);
  });
});

describe('mic button in sentence practice', () => {
  test('speaking the sentence in kana answers it through the same check as typing', async () => {
    await renderPractice(setSentencePracticeStorage);
    jest.useFakeTimers();

    const button = micButton();
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('mic-icon', 'muted');
    expect(button).not.toHaveClass('active');
    expect(button).toHaveAccessibleName('Answer by voice');

    // Speaking starts: the recognizer listens for Japanese without pausing
    await act(async () => { fireEvent.click(button); });
    const recognition = lastRecognition();
    expect(recognition.started).toBe(true);
    expect(recognition.lang).toBe('ja-JP');
    expect(recognition.continuous).toBe(true);
    expect(button).toHaveClass('mic-icon', 'active');
    expect(button).not.toHaveClass('muted');

    // The sentence is spoken: listening stops and the answer is checked
    await act(async () => { recognition.emitFinal('これはみずです'); });
    await act(async () => { jest.advanceTimersByTime(2100); });
    expect(button).toHaveClass('mic-icon', 'muted');
    expect(button).not.toHaveClass('active');
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');
    expect(sentenceStats().currentGameStats.rightGuesses).toBe(1);

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('a recognizer kanji transcription still counts as the sentence', async () => {
    await renderPractice(setSentencePracticeStorage);
    jest.useFakeTimers();

    await act(async () => { fireEvent.click(micButton()); });
    // Chrome transcribes the spoken みず as the on-screen kanji 水, which
    // japaneseToRomaji drops; the on-screen text is the fallback candidate
    await act(async () => { lastRecognition().emitFinal('これは水です'); });
    await act(async () => { jest.advanceTimersByTime(2100); });

    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('unmatched speech is filled into the input instead of answering', async () => {
    await renderPractice(setSentencePracticeStorage);
    jest.useFakeTimers();

    await act(async () => { fireEvent.click(micButton()); });
    await act(async () => { lastRecognition().emitFinal('すし'); });
    await act(async () => { jest.advanceTimersByTime(2100); });

    expect(beforeCursor().textContent).toBe('sushi');
    expect(cursorGroup()).toHaveClass('answer-wrong');
    expect(score()).toHaveTextContent('0');

    // The filled answer behaves like typed text: fixable key by key
    pressKeys('Backspace', 'Backspace', 'Backspace', 'Backspace', 'Backspace');
    pressKeys(...SENTENCE_ROMANJI.split(''));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('clicking the mic again stops listening without answering', async () => {
    await renderPractice(setSentencePracticeStorage);

    await act(async () => { fireEvent.click(micButton()); });
    const recognition = lastRecognition();

    await act(async () => { fireEvent.click(micButton()); });
    expect(recognition.stopped).toBe(true);
    expect(micButton()).toHaveClass('mic-icon', 'muted');
    expect(micButton()).not.toHaveClass('active');
    expect(score()).toHaveTextContent('0');
  });

  test('a recognizer error flashes the error state instead of listening forever', async () => {
    await renderPractice(setSentencePracticeStorage);

    await act(async () => { fireEvent.click(micButton()); });
    await act(async () => { lastRecognition().emitError('not-allowed'); });
    expect(micButton()).toHaveClass('mic-icon', 'muted', 'mic-error');
    expect(micButton()).not.toHaveClass('active');
    expect(score()).toHaveTextContent('0');
  });

  test('the mic button stays hidden without speech recognition support', async () => {
    delete window.SpeechRecognition;
    await renderPractice(setSentencePracticeStorage);
    expect(micButton()).toBeNull();
    expect(document.querySelector('#in-game-text-input')).toBeInTheDocument();
  });

  test('the mic button only appears in sentence practice, not in word practice', async () => {
    await renderPractice(setWordPracticeStorage);
    expect(displayedCharacter()).toBe('アイス');
    expect(micButton()).toBeNull();
    expect(document.querySelector('#in-game-text-input')).toBeInTheDocument();
  });
});
