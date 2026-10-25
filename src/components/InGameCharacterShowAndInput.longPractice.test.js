import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InGameCharacterShowAndInput from './InGameCharacterShowAndInput';
import { getReadableSentences, sentences } from '../sentences.js';
import { kanaCharacters } from '../kanaCharacters.js';

/*
 * Tests for the "long" practice mode: real beginner sentences (e.g. わたしは学生です)
 * that have to be typed as a single romaji answer. Only sentences readable with
 * the selected hiragana / katakana / kanji groups are shown. The romaji is
 * never given away as help: asking for help reveals small furigana above the
 * kanji, and a correct answer reveals the romaji and the meaning of the sentence.
 *
 * The sentence is picked at random, so instead of pinning one the tests read
 * the displayed sentence and look up its data (romaji + meaning) in
 * sentences.js. A test about one sentence passes it with the navigation
 * (`only`, the way Try Problematics does): picking groups that make a single
 * sentence readable breaks as soon as a kana-only sentence is added.
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
// The sentence as shown, without the furigana help adds above the kanji
const sentenceWithoutFurigana = () => {
  const copy = document.querySelector('#in-game-kana-character > p').cloneNode(true);
  copy.querySelectorAll('rt').forEach(rt => rt.remove());
  return copy.textContent;
};

function pressKeys(...keys) {
  keys.forEach(key => fireEvent.keyDown(window, { key }));
}

// only: the sentences the game may show (as Try Problematics passes them)
async function renderLongPractice(checkedKanas = ALL_GROUP_TITLES, { exercise = 'type', only = null } = {}) {
  localStorage.setItem('checkedKanas', JSON.stringify(checkedKanas));
  localStorage.setItem('game-mode-sentence-exercise', exercise);
  localStorage.setItem('game-mode-practice', 'long');
  localStorage.setItem('game-mode-word', 'false');
  localStorage.setItem('game-mode-touch', 'false');
  localStorage.setItem('game-mode-auto-next', 'false');
  localStorage.setItem('gameMode', JSON.stringify({ type: 'kana-selector', value: -1 }));
  localStorage.setItem('userStats', '{}');
  // The first sentence is loaded asynchronously when the game mounts
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[only ? { pathname: '/game', state: { characters: only } } : '/game']}>
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

  test('typing the whole sentence reveals its meaning', async () => {
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

    // The romaji (shown once, above) and the meaning are revealed
    expect(solution()).not.toHaveClass('hidden-element');
    expect(solution().querySelector('#in-game-solution-romanji-one')).toHaveTextContent(entry.romanji[0]);
    expect(solution().querySelector('.in-game-solution-romanji')).toBeNull();
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
    // The groups これは水です is made of: it is readable, a sentence with a
    // kanji of another group (学生) is not, and what is shown is readable
    const selection = ['か', 'ら', 'は', 'だ', 'さ', kanjiGroupOf('水')];
    const readable = getReadableSentences(selection).map(entry => entry.jp_character);
    expect(readable).toContain('これは水です');
    expect(readable.some(sentence => sentence.includes('学'))).toBe(false);
    await renderLongPractice(selection);

    const sentence = displayedSentence();
    expect(readable).toContain(sentence);

    // A filtered sentence plays like any other one: typing it reveals the meaning
    const entry = sentenceEntry(sentence);
    pressKeys(...typedAnswerOf(entry).split(''));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(solution().querySelector('.in-game-solution-romanji')).toBeNull();
    expect(solution()).toHaveTextContent(entry.meaning);

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('wraps the particles of the sentence so they can be styled differently', async () => {
    // Only これは水です, which makes the assertion deterministic
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });

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

  test('asking for help shows furigana above the kanji instead of the romaji', async () => {
    // Only これは水です, which makes the assertion deterministic
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });

    expect(displayedSentence()).toBe('これは水です');

    // Before help: no furigana, and the romaji hint stays hidden
    expect(document.querySelector('#in-game-kana-character rt')).toBeNull();
    expect(document.querySelector('#in-game-kana-solution')).toHaveClass('hidden-element');

    pressKeys('?');

    // Small furigana appears above the kanji (水 -> みず), no romaji anywhere
    const annotations = [...document.querySelectorAll('#in-game-kana-character ruby')]
      .map(ruby => [ruby.childNodes[0].textContent, ruby.querySelector('rt')?.textContent]);
    expect(annotations).toEqual([['水', 'みず']]);
    expect(document.querySelector('#in-game-kana-solution')).toHaveClass('hidden-element');
    expect(solution()).toHaveClass('hidden-element');
    expect(sentenceStats('これは水です').currentGameStats.askForHelpCounter).toBe(1);

    // The furigana stays visible while the meaning is revealed on a correct answer
    pressKeys(...typedAnswerOf(sentenceEntry('これは水です')).split(''));
    expect(solution()).not.toHaveClass('hidden-element');
    expect(document.querySelector('#in-game-kana-character rt')).toHaveTextContent('みず');

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('marks exactly the furigana of every shown sentence', async () => {
    await renderLongPractice();

    // Data-driven: the furigana annotations must match the sentence data
    // (hundreds of generated ones included)
    const sentence = displayedSentence();
    const entry = sentenceEntry(sentence);
    pressKeys('?');
    const annotated = [...document.querySelectorAll('#in-game-kana-character ruby')]
      .map(ruby => [ruby.childNodes[0].textContent, ruby.querySelector('rt')?.textContent]);
    const expected = Object.entries(entry.furigana || {})
      .map(([index, reading]) => [[...sentence][index], reading]);
    expect(annotated).toEqual(expected);

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

  test('keys pressed after a correct sentence do not count it again', async () => {
    await renderLongPractice();

    const sentence = displayedSentence();
    const answer = typedAnswerOf(sentenceEntry(sentence));
    pressKeys(...answer.split(''));
    expect(score()).toHaveTextContent('1');

    // A space, Shift, arrows, a stray letter and Backspace while the meaning is shown
    pressKeys(' ', 'Shift', 'ArrowLeft', 'ArrowRight', 'x', 'Backspace');
    expect(beforeCursor().textContent).toBe(answer);
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(cursorGroup()).not.toHaveClass('answer-wrong');
    expect(score()).toHaveTextContent('1');
    expect(sentenceStats(sentence).currentGameStats).toMatchObject({ rightGuesses: 1, wrongSubmissions: 0 });

    // One Enter shows exactly one new sentence
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Enter' });
    });
    const shownSentences = Object.values(JSON.parse(localStorage.getItem('userStats')))
      .reduce((total, stats) => total + stats.totalTimesShown, 0);
    expect(shownSentences).toBe(2);
    expect(beforeCursor().textContent).toBe('');
  });

  test('accepts other spellings of the sentence (Kunrei-shiki, は typed as ha)', async () => {
    // Only これは水です
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });

    pressKeys(...'korehamizudesu'.split(''));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');

    await tapNextButton();
  });

  test('marks only the text from the first mistake on as wrong', async () => {
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });

    pressKeys(...'kore wa mx'.split(''));
    expect(cursorGroup()).toHaveClass('answer-wrong');
    expect(beforeCursor().textContent).toBe('kore wa mx');
    expect(beforeCursor().querySelector('.in-game-typed-mistake')).toHaveTextContent('x');

    // Fixing the mistake removes the mark
    pressKeys('Backspace');
    expect(cursorGroup()).not.toHaveClass('answer-wrong');
    expect(beforeCursor().querySelector('.in-game-typed-mistake')).toBeNull();
    expect(beforeCursor().textContent).toBe('kore wa m');
  });

  test('tapping the typed answer moves the caret so a mistake in the middle can be fixed', async () => {
    // Only これは水です
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });

    // The sentence typed with a typo in its middle: mizo instead of mizu
    pressKeys(...'korewamizodesu'.split(''));
    expect(cursorGroup()).toHaveClass('answer-wrong');
    expect(beforeCursor().textContent).toBe('korewamizodesu');

    // Tapping after the wrong "o" aims the caret there: the browser reports
    // the text position under the tapped point, like in a real text field
    const wrongPart = beforeCursor().querySelector('.in-game-typed-mistake');
    document.caretRangeFromPoint = () => ({ startContainer: wrongPart.firstChild, startOffset: 1 });
    fireEvent.click(cursorGroup());
    delete document.caretRangeFromPoint;

    // The caret now sits in the middle: the rest follows it in its own part,
    // and the mistake stays marked red
    expect(beforeCursor().textContent).toBe('korewamizo');
    expect(document.querySelector('#in-game-text-input-after-cursor')).toHaveTextContent('desu');
    expect(beforeCursor().querySelector('.in-game-typed-mistake')).toHaveTextContent('o');

    // Backspace removes the "o" in the middle, then "u" completes the word
    pressKeys('Backspace');
    expect(beforeCursor().textContent).toBe('korewamiz');
    pressKeys('u');
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');

    // Start the next sentence so the game drops its Enter / tap listeners
    await tapNextButton();
  });

  test('dims the words of the sentence that are already typed', async () => {
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });
    const typedCharacters = () => [...document.querySelectorAll('#in-game-kana-character .in-game-sentence-typed')]
      .map(element => element.textContent).join('');

    expect(typedCharacters()).toBe('');
    pressKeys(...'kore'.split(''));
    expect(typedCharacters()).toBe('これ');
    pressKeys(...'wa'.split(''));
    expect(typedCharacters()).toBe('これは');
    pressKeys('Backspace');
    expect(typedCharacters()).toBe('これ');
  });

  test('help comes in steps: furigana, then the romaji of the word being typed', async () => {
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });
    const hint = () => document.querySelector('#in-game-sentence-hint');

    pressKeys('?');
    expect(document.querySelector('#in-game-kana-character rt')).toHaveTextContent('みず');
    expect(hint()).toBeNull();

    pressKeys(...'korewa'.split(''), '?');
    expect(hint()).toHaveTextContent('mizu');
    // Asking again for the same word costs nothing more
    pressKeys('?');
    expect(sentenceStats('これは水です').currentGameStats.askForHelpCounter).toBe(2);

    // The hint goes away once its word is typed
    pressKeys(...'mizu'.split(''));
    expect(hint()).toBeNull();
  });

  test('shows every word of the sentence with its meaning after a correct answer', async () => {
    await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です'] });

    pressKeys(...'korewamizudesu'.split(''));
    const words = [...solution().querySelectorAll('.sentence-breakdown-word')].map(word => [
      word.querySelector('.sentence-breakdown-jp').textContent,
      word.querySelector('.sentence-breakdown-romaji').textContent,
      word.classList.contains('is-particle'),
    ]);
    expect(words).toEqual([
      ['これ', 'kore', false],
      ['は', 'wa', true],
      ['水', 'mizu', false],
      ['です', 'desu', false],
    ]);
    expect(solution().querySelector('.sentence-breakdown-word.is-particle .sentence-breakdown-meaning'))
      .toHaveTextContent('topic');

    await tapNextButton();
  });

  test('a mobile keyboard adding a space after a correct sentence does not count it again', async () => {
    await renderLongPractice();

    const answer = typedAnswerOf(sentenceEntry(displayedSentence()));
    const hiddenInput = document.querySelector('#in-game-text-input');
    fireEvent.input(hiddenInput, { target: { value: answer } });
    expect(score()).toHaveTextContent('1');

    fireEvent.input(hiddenInput, { target: { value: answer + ' ' } });
    expect(score()).toHaveTextContent('1');
    expect(hiddenInput.value).toBe(answer);

    await tapNextButton();
  });
});

/*
 * The other sentence exercises, all with これは水です: listening, the
 * missing particle and arranging the shuffled words.
 */
describe('sentence exercises', () => {
  const renderOneSentence = (options) => renderLongPractice(ALL_GROUP_TITLES, { ...options, only: ['これは水です'] });
  const prompt = () => document.querySelector('.in-game-sentence-prompt');
  const hint = () => document.querySelector('#in-game-sentence-hint');

  test('particle: the particle is hidden and only it is typed', async () => {
    await renderOneSentence({ exercise: 'particle' });

    expect(displayedSentence()).toBe('これ？水です');
    expect(prompt()).toHaveTextContent('Type the missing particle');
    expect(prompt()).toHaveTextContent(sentenceEntry('これは水です').meaning);

    // Help: furigana first, then what the particle does (never the answer)
    pressKeys('?');
    expect(document.querySelector('#in-game-kana-character rt')).toHaveTextContent('みず');
    pressKeys('?');
    expect(hint()).toHaveTextContent('topic');

    pressKeys('h', 'a');
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(score()).toHaveTextContent('1');
    // The answered sentence is shown whole, with its breakdown
    expect(sentenceWithoutFurigana()).toBe('これは水です');
    expect(hint()).toBeNull();
    expect(solution().querySelectorAll('.sentence-breakdown-word')).toHaveLength(4);

    await tapNextButton();
  });

  test('arrange: the words are shown out of order and typed in order', async () => {
    await renderOneSentence({ exercise: 'arrange' });
    const chips = () => [...document.querySelectorAll('.in-game-sentence-chip')];
    const usedChips = () => chips().filter(chip => chip.classList.contains('is-used')).map(chip => chip.textContent);

    expect(chips().map(chip => chip.textContent).sort()).toEqual(['これ', 'です', 'は', '水'].sort());
    expect(displayedSentence()).not.toBe('これは水です');
    expect(prompt()).toHaveTextContent('Put the words in order');

    pressKeys(...'korewa'.split(''));
    expect(usedChips().sort()).toEqual(['これ', 'は'].sort());

    // Help: furigana, then the next word with its romaji
    pressKeys('?', '?');
    expect(hint()).toHaveTextContent('水 · mizu');

    pressKeys(...'mizudesu'.split(''));
    expect(cursorGroup()).toHaveClass('answer-correct');
    expect(sentenceWithoutFurigana()).toBe('これは水です');

    await tapNextButton();
  });

  describe('listen', () => {
    let spoken;
    beforeEach(() => {
      spoken = [];
      window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) { this.text = text; };
      window.speechSynthesis = {
        speak: (utterance) => spoken.push(utterance.text),
        cancel: () => {},
        getVoices: () => [],
      };
    });
    afterEach(() => {
      delete window.SpeechSynthesisUtterance;
      delete window.speechSynthesis;
    });

    test('the sentence is read out and hidden until help or a correct answer', async () => {
      await renderOneSentence({ exercise: 'listen' });

      expect(spoken).toEqual(['これは水です']);
      expect(displayedSentence()).toBe('');
      expect(prompt()).toHaveTextContent('Type what you hear');
      // The meaning would give the sentence away
      expect(prompt()).not.toHaveTextContent(sentenceEntry('これは水です').meaning);

      // The replay button reads it again
      fireEvent.click(document.querySelector('.in-game-sentence-listen'));
      expect(spoken).toHaveLength(2);

      // Help: the text first
      pressKeys('?');
      expect(displayedSentence()).toBe('これは水です');
      expect(document.querySelector('#in-game-kana-character rt')).toBeNull();
      pressKeys('?');
      expect(document.querySelector('#in-game-kana-character rt')).toHaveTextContent('みず');

      pressKeys(...'korewamizudesu'.split(''));
      expect(cursorGroup()).toHaveClass('answer-correct');

      await tapNextButton();
    });

    test('falls back to reading when the browser cannot speak', async () => {
      delete window.SpeechSynthesisUtterance;
      delete window.speechSynthesis;
      await renderOneSentence({ exercise: 'listen' });

      expect(displayedSentence()).toBe('これは水です');
      expect(prompt()).toBeNull();
    });
  });
});

test('never shows the same sentence twice in a row', async () => {
  // With only これは水です and それはなんですか, the game has to alternate
  await renderLongPractice(ALL_GROUP_TITLES, { only: ['これは水です', 'それはなんですか'] });
  let previous = displayedSentence();
  expect(['これは水です', 'それはなんですか']).toContain(previous);
  for (let round = 0; round < 10; round++) {
    pressKeys(...typedAnswerOf(sentenceEntry(previous)).split(''));
    await tapNextButton();
    const shown = displayedSentence();
    expect(shown).not.toBe(previous);
    previous = shown;
  }
});
