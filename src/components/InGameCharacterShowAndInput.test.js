import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InGameCharacterShowAndInput from './InGameCharacterShowAndInput';
import { kanaCharacters } from '../kanaCharacters.js';

/*
 * Tests for the "words" practice mode: the long typing exercise where a whole
 * word (e.g. アイス = "aisu") has to be typed key by key instead of one kana.
 *
 * The game only shows words whose kana groups are all selected. アイス is the
 * only word built from the groups ア and サ, so selecting exactly those two
 * groups pins the word that is shown and keeps every expectation deterministic.
 */
const WORD = Object.values(kanaCharacters.words).find(word => word.jp_character === 'アイス');
const WORD_JP = WORD.jp_character;
const WORD_ROMANJI = WORD.romanji[0];
const WORD_MEANING = WORD.meaning;
const WORD_GROUPS = [...WORD.katakana_groups, ...WORD.hiragana_groups];

// The game reads and writes its answer through direct DOM access, so the tests
// query the same elements the players see.
const kanaCharacter = () => document.querySelector('#in-game-kana-character');
const displayedWord = () => document.querySelector('#in-game-kana-character > p').textContent;
const cursorGroup = () => document.querySelector('#in-game-text-input-cursor-group');
const beforeCursor = () => document.querySelector('#in-game-text-input-before-cursor');
const solution = () => document.querySelector('#in-game-solution');
const nextButton = () => document.querySelector('#in-game-next-button');
const score = () => document.getElementById('in-game-score');
const wordStats = () => (JSON.parse(localStorage.getItem('userStats')) || {})[WORD_JP];

// The hidden input exists for mobile keyboards; desktop typing arrives as
// window keydown events, which is what a desktop player produces as well.
function pressKeys(...keys) {
  keys.forEach(key => fireEvent.keyDown(window, { key }));
}

function setWordsPracticeStorage(autoNext) {
  localStorage.setItem('checkedKanas', JSON.stringify(WORD_GROUPS));
  localStorage.setItem('game-mode-practice', 'words');
  localStorage.setItem('game-mode-word', 'true');
  localStorage.setItem('game-mode-touch', 'false');
  localStorage.setItem('game-mode-auto-next', String(autoNext));
  localStorage.setItem('gameMode', JSON.stringify({ type: 'kana-selector', value: -1 }));
  localStorage.setItem('userStats', '{}');
}

async function renderWordsPractice({ autoNext = false } = {}) {
  setWordsPracticeStorage(autoNext);
  // The first word is loaded asynchronously when the game mounts
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

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('words practice (long typing)', () => {
  test('shows a multi-character word and keeps the answer hidden', async () => {
    await renderWordsPractice();

    expect(displayedWord()).toBe(WORD_JP);
    // The word mode answer is a whole word, not a single kana
    expect([...displayedWord()].length).toBeGreaterThan(1);

    // Words are answered by typing: no multiple-choice buttons are shown
    expect(document.querySelector('#in-game-text-input')).toBeInTheDocument();
    expect(document.querySelector('.in-game-touch-answer-group')).toBeNull();
    expect(document.querySelector('#in-game-text-input-placeholder')).toHaveTextContent('type romaji');

    // Romanji and meaning stay hidden until the word is typed
    expect(solution()).toHaveClass('hidden-element');
    expect(score()).toHaveTextContent('0');
  });

  test('only marks the answer correct once the whole word is typed', async () => {
    await renderWordsPractice();

    const prefix = WORD_ROMANJI.slice(0, -1);
    pressKeys(...prefix.split(''));
    expect(beforeCursor().textContent).toBe(prefix);
    // A partial word is neither wrong nor correct
    expect(cursorGroup()).not.toHaveClass('answer-wrong');
    expect(cursorGroup()).not.toHaveClass('answer-correct');
    expect(solution()).toHaveClass('hidden-element');
    expect(score()).toHaveTextContent('0');

    pressKeys(WORD_ROMANJI.slice(-1));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');
    // The romanji and the meaning of the word are revealed
    expect(solution()).not.toHaveClass('hidden-element');
    expect(solution()).toHaveTextContent(WORD_ROMANJI);
    expect(solution()).toHaveTextContent(WORD_MEANING);
    // ...and the word is stored as practiced
    expect(wordStats().currentGameStats.rightGuesses).toBe(1);
    expect(wordStats().totalRightGuesses).toBe(1);

    // With auto next off the game waits for the player; the Next button
    // starts the next round
    expect(nextButton()).not.toHaveClass('hidden-element');
    await tapNextButton();
    expect(beforeCursor().textContent).toBe('');
    expect(solution()).toHaveClass('hidden-element');
    expect(nextButton()).toHaveClass('hidden-element');
    expect(displayedWord()).toBe(WORD_JP);
    expect(wordStats().totalTimesShown).toBe(2);
  });

  test('moves on to the next word by itself when auto next is on', async () => {
    jest.useFakeTimers();
    await renderWordsPractice({ autoNext: true });

    pressKeys(...WORD_ROMANJI.split(''));
    expect(solution()).not.toHaveClass('hidden-element');
    expect(wordStats().totalTimesShown).toBe(1);

    // Auto next waits one second before the next word is picked
    await act(async () => {
      jest.advanceTimersByTime(1200);
    });

    // A new round started: answer cleared, feedback hidden, next word shown
    expect(displayedWord()).toBe(WORD_JP);
    expect(beforeCursor().textContent).toBe('');
    expect(solution()).toHaveClass('hidden-element');
    expect(kanaCharacter()).not.toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');
    expect(wordStats().totalTimesShown).toBe(2);
  });

  test('counts one wrong submission per word and tracks backspace fixes', async () => {
    await renderWordsPractice();

    pressKeys('x', 'y');
    expect(beforeCursor().textContent).toBe('xy');
    // A wrong key flags the answer once...
    expect(cursorGroup()).toHaveClass('answer-wrong');
    expect(wordStats().currentGameStats.wrongSubmissions).toBe(1);

    // ...but staying wrong costs nothing extra for the same word
    pressKeys('z');
    expect(wordStats().currentGameStats.wrongSubmissions).toBe(1);

    // Backspacing the wrong keys is tracked as edits
    pressKeys('Backspace', 'Backspace', 'Backspace');
    expect(beforeCursor().textContent).toBe('');
    expect(cursorGroup()).not.toHaveClass('answer-wrong');
    expect(wordStats().currentGameStats.editCount).toBe(3);

    // After the fix the long word can still be completed
    pressKeys(...WORD_ROMANJI.split(''));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');
    expect(wordStats().currentGameStats.rightGuesses).toBe(1);
    expect(wordStats().currentGameStats.wrongSubmissions).toBe(1);
    expect(wordStats().currentGameStats.editCount).toBe(3);

    // Start the next round so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('advances with the Enter key when auto next is off', async () => {
    await renderWordsPractice();

    pressKeys(...WORD_ROMANJI.split(''));
    expect(nextButton()).not.toHaveClass('hidden-element');

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Enter', bubbles: true });
    });

    expect(beforeCursor().textContent).toBe('');
    expect(solution()).toHaveClass('hidden-element');
    expect(nextButton()).toHaveClass('hidden-element');
    expect(wordStats().totalTimesShown).toBe(2);
  });
});
