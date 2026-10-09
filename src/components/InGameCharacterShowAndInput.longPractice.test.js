import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InGameCharacterShowAndInput from './InGameCharacterShowAndInput';
import { sentences } from '../sentences.js';
import { kanaCharacters } from '../kanaCharacters.js';

/*
 * Tests for the "long" practice mode: real beginner sentences (e.g. わたしは学生です)
 * that have to be typed as a single romaji answer. Only sentences readable with
 * the selected hiragana / katakana / kanji groups are shown, and the meaning of
 * the sentence is revealed together with the romaji once it is typed correctly.
 *
 * The sentence is picked at random, so instead of pinning one the tests read
 * the displayed sentence and look up its data (romaji + meaning) in
 * sentences.js.
 *
 * The particles of a sentence (は, を, に...) are wrapped in their own
 * element so they can be shown in a different color than the rest.
 */
const sentenceEntry = (sentence) => sentences.find(entry => entry.jp_character === sentence);
// The accepted answers contain spaces for readability; players may type with
// or without them, so the tests type the space-less form
const typedAnswerOf = (entry) => entry.romanji[0].replace(/ /g, '');

// Every selectable group: with all of them picked every sentence is readable
const ALL_GROUP_TITLES = ['hiragana', 'katakana', 'kanji'].flatMap(script =>
  Object.values(kanaCharacters[script] || {}).map(group => group.title)
);
// The kanji group a character is taught in (e.g. 水 -> "N5 Nature")
const kanjiGroupOf = (character) => Object.values(kanaCharacters.kanji)
  .find(group => Object.values(group.characters).some(item => item.jp_character === character))?.title;

// The game reads and writes its answer through direct DOM access, so the tests
// query the same elements the players see.
const displayedSentence = () => document.querySelector('#in-game-kana-character > p').textContent;
const cursorGroup = () => document.querySelector('#in-game-text-input-cursor-group');
const beforeCursor = () => document.querySelector('#in-game-text-input-before-cursor');
const solution = () => document.querySelector('#in-game-solution');
const nextButton = () => document.querySelector('#in-game-next-button');
const score = () => document.getElementById('in-game-score');
const sentenceStats = (sentence) => (JSON.parse(localStorage.getItem('userStats')) || {})[sentence];

function pressKeys(...keys) {
  keys.forEach(key => fireEvent.keyDown(window, { key }));
}

async function renderLongPractice(checkedKanas = ALL_GROUP_TITLES) {
  localStorage.setItem('checkedKanas', JSON.stringify(checkedKanas));
  localStorage.setItem('game-mode-practice', 'long');
  localStorage.setItem('game-mode-word', 'false');
  localStorage.setItem('game-mode-touch', 'false');
  localStorage.setItem('game-mode-auto-next', 'false');
  localStorage.setItem('gameMode', JSON.stringify({ type: 'kana-selector', value: -1 }));
  localStorage.setItem('userStats', '{}');
  // The first sentence is loaded asynchronously when the game mounts
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

describe('long practice (real sentences)', () => {
  test('shows one of the curated sentences', async () => {
    await renderLongPractice();

    const sentence = displayedSentence();
    expect(sentenceEntry(sentence)).toBeDefined();

    // Sentences are answered by typing: no multiple-choice buttons are shown
    expect(document.querySelector('#in-game-text-input')).toBeInTheDocument();
    expect(document.querySelector('.in-game-touch-answer-group')).toBeNull();

    // The romaji and the meaning stay hidden until the sentence is typed
    expect(solution()).toHaveClass('hidden-element');
    expect(score()).toHaveTextContent('0');
  });

  test('typing the whole sentence reveals its romaji and meaning', async () => {
    await renderLongPractice();

    const sentence = displayedSentence();
    const entry = sentenceEntry(sentence);
    const answer = typedAnswerOf(entry);
    pressKeys(...answer.split(''));
    expect(beforeCursor().textContent).toBe(answer);

    // The whole sentence counts as one correct answer
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');
    expect(sentenceStats(sentence).currentGameStats.rightGuesses).toBe(1);

    // The romaji is revealed together with the meaning of the sentence
    expect(solution()).not.toHaveClass('hidden-element');
    expect(solution()).toHaveTextContent(entry.romanji[0]);
    expect(solution()).toHaveTextContent(entry.meaning);

    // Auto next is off, so the Next button starts a new sentence
    expect(nextButton()).not.toHaveClass('hidden-element');
    await tapNextButton();
    expect(beforeCursor().textContent).toBe('');
    expect(solution()).toHaveClass('hidden-element');
    expect(nextButton()).toHaveClass('hidden-element');
    expect(sentenceEntry(displayedSentence())).toBeDefined();
  });

  test('only shows sentences readable with the selected groups', async () => {
    // These are exactly the groups これは水です is made of, so it is the only
    // sentence that can be shown (かんじ-free sentences need な / わ, etc.)
    await renderLongPractice(['か', 'ら', 'は', 'だ', 'さ', kanjiGroupOf('水')]);

    const sentence = displayedSentence();
    expect(sentence).toBe('これは水です');

    // A filtered sentence plays like any other one: typing it reveals the meaning
    const entry = sentenceEntry(sentence);
    pressKeys(...typedAnswerOf(entry).split(''));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(solution()).toHaveTextContent(entry.romanji[0]);
    expect(solution()).toHaveTextContent(entry.meaning);

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('wraps the particles of the sentence so they can be styled differently', async () => {
    // これは水です is the only sentence this selection can show, which makes
    // the assertion deterministic
    await renderLongPractice(['か', 'ら', 'は', 'だ', 'さ', kanjiGroupOf('水')]);

    expect(displayedSentence()).toBe('これは水です');

    // Only は is a particle here: で and す belong to です, not to a particle
    const markedParticles = [...document.querySelectorAll('#in-game-kana-character .in-game-particle')]
      .map(span => span.textContent);
    expect(markedParticles).toEqual(['は']);

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('marks exactly the particles of every shown sentence', async () => {
    await renderLongPractice();

    // Data-driven: compare the marked characters with the particle indices of
    // whichever sentence was picked (hundreds of generated ones included)
    const sentence = displayedSentence();
    const entry = sentenceEntry(sentence);
    const marked = [...document.querySelectorAll('#in-game-kana-character .in-game-particle')]
      .map(span => span.textContent).join('');
    expect(marked).toBe(entry.particles.map(index => [...sentence][index]).join(''));

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('flags a wrong key and lets the player fix the sentence', async () => {
    await renderLongPractice();

    const sentence = displayedSentence();
    const answer = typedAnswerOf(sentenceEntry(sentence));

    // "x" can never start any sentence reading
    pressKeys('x');
    expect(cursorGroup()).toHaveClass('answer-wrong');
    expect(sentenceStats(sentence).currentGameStats.wrongSubmissions).toBe(1);

    // Backspacing the wrong key counts as an edit and clears the red flag
    pressKeys('Backspace');
    expect(beforeCursor().textContent).toBe('');
    expect(cursorGroup()).not.toHaveClass('answer-wrong');
    expect(sentenceStats(sentence).currentGameStats.editCount).toBe(1);

    // The sentence can still be completed after the fix
    pressKeys(...answer.split(''));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });
});
