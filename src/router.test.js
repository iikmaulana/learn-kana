import React from 'react';
import { act, cleanup, createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { appRoutes } from './router';
import { LanguageProvider } from './i18n';
import { translate } from './i18n';
import { kanaCharacters, kanjiLevels } from './kanaCharacters.js';
import { sentences } from './sentences.js';
import { getBunpouQuestions } from './bunpou.js';
import { getListOfKanjiWords } from './practiceList.js';
import { kanjiReadings } from './kanjiReadings.js';
import { readingsUsedInWord } from './kanjiWordReadings.js';
import { NEW_KANJI_PER_DAY, recordKanjiSrsAnswer } from './kanjiSrs.js';
import { getDictionaryEntries } from './dictionary.js';

/*
 * The routes of the app, with the same route list as the real app: the menu
 * at /, the game at /game, the old /learn-kana∕game address, session modes
 * passed with the address, and the game restarting without a page reload.
 */
let router;

// The pages other than the menu are loaded when opened (React.lazy in
// router.js): load them once, so a test only waits for React to show them
beforeAll(() => Promise.all([
  import('./pages/InGame'),
  import('./pages/Dictionary'),
  import('./pages/Materi'),
  import('./pages/Chat'),
  import('./NotFound'),
]));

// Until the page is there instead of its "Loading…" (Layout's Suspense)
const pageLoaded = () => waitFor(() => expect(document.querySelector('.page-loading')).toBeNull());

async function open(entry) {
  router = createMemoryRouter(appRoutes, { initialEntries: [entry] });
  await act(async () => {
    render(
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    );
  });
  await pageLoaded();
}

const path = () => router.state.location.pathname;
const displayed = () => document.querySelector('#in-game-kana-character > p')?.textContent;
const score = () => document.getElementById('in-game-score');

function practiceCharacters(groups) {
  localStorage.setItem('language', 'en');
  localStorage.setItem('checkedKanas', JSON.stringify(groups));
  localStorage.setItem('game-mode-practice', 'characters');
  localStorage.setItem('game-mode-touch', 'false');
  localStorage.setItem('game-mode-auto-next', 'false');
  localStorage.setItem('gameMode', JSON.stringify({ type: 'kana-selector', value: -1 }));
}

beforeEach(() => {
  localStorage.clear();
  // The Dictionary keeps its search here
  sessionStorage.clear();
  // jsdom has no scrollIntoView; the Chat tab scrolls its thread on mount
  window.HTMLElement.prototype.scrollIntoView = () => { };
  practiceCharacters(['あ']);
});

test('the game is at /game', async () => {
  await open('/game');
  expect(path()).toBe('/game');
  expect(['あ', 'い', 'う', 'え', 'お']).toContain(displayed());
});

test('the old game address leads to /game', async () => {
  await open('/learn-kana∕game');
  expect(path()).toBe('/game');
  expect(displayed()).toBeTruthy();
});

test('the old menu address leads to the menu', async () => {
  await open('/learn-kana');
  expect(path()).toBe('/');
  expect(document.getElementById('game-menu-title')).toBeInTheDocument();
});

test('the menu starts kanji reviews with ?mode=review', async () => {
  await open('/');
  const reviewLinks = [...document.querySelectorAll('a.srs-review-banner-button')];
  reviewLinks.forEach(link => expect(link.getAttribute('href')).toBe('/game?mode=review'));
  expect(document.querySelector('.game-menu-start a').getAttribute('href')).toBe('/game');
});

test('Try Problematics characters come with the navigation, not from localStorage', async () => {
  await open({ pathname: '/game', state: { characters: ['い'] } });
  for (let round = 0; round < 5; round++) {
    expect(displayed()).toBe('い');
    await act(async () => {
      fireEvent.keyDown(window, { key: 'i' });
      await new Promise(resolve => setTimeout(resolve, 250));
    });
  }
  // A normal game afterwards shows the whole group again
  expect(localStorage.getItem('problematicKanasFilter')).toBeNull();
});

test('a game that cannot start goes back to the menu with the reason', async () => {
  practiceCharacters([]);
  await open('/game');
  expect(path()).toBe('/');
  expect(screen.getByRole('alert')).toHaveTextContent(translate('en', 'gameErrorNoKana'));

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  expect(screen.queryByRole('alert')).toBeNull();
});

describe('after a game', () => {
  async function finishWord() {
    // Answer one kana, then end the game with Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: displayedRomaji() });
      await new Promise(resolve => setTimeout(resolve, 250));
    });
    fireEvent.keyDown(window, { key: 'Escape' });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 650));
    });
  }
  const displayedRomaji = () => ({ 'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o' })[displayed()];

  test('Play again starts a new game without reloading the page', async () => {
    await open('/game');
    await finishWord();
    expect(score()).toHaveTextContent('1');
    expect(document.querySelector('.score-button-primary')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(document.querySelector('.score-button-primary'));
    });
    expect(path()).toBe('/game');
    expect(score()).toHaveTextContent('0');
    expect(document.querySelector('.score-button-primary')).toBeNull();
  });

  test('Play again keeps a kanji review a review', async () => {
    // A review of a kanji group, ended early with Esc: more kanji are left
    localStorage.setItem('checkedKanas', JSON.stringify(Object.values(kanaCharacters.kanji).map(group => group.title)));
    await open('/game?mode=review');
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    const firstGame = router.state.location.key;
    await act(async () => {
      fireEvent.click(document.querySelector('.score-button-primary'));
    });
    expect(router.state.location.key).not.toBe(firstGame);
    expect(router.state.location.search).toBe('?mode=review');
  });

  test('Back to menu goes to the menu', async () => {
    await open('/game');
    await finishWord();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    });
    expect(path()).toBe('/');
    expect(router.state.location.hash).toBe('#game-menu-title');
  });

  test('leaving a game with the browser Back button leaves nothing running', async () => {
    localStorage.setItem('checkedKanas', JSON.stringify(['ア', 'サ']));
    localStorage.setItem('game-mode-practice', 'words');
    localStorage.setItem('game-mode-word', 'true');
    router = createMemoryRouter(appRoutes, { initialEntries: ['/', '/game'], initialIndex: 1 });
    await act(async () => {
      render(
        <LanguageProvider>
          <RouterProvider router={router} />
        </LanguageProvider>
      );
    });
    // Answer the word: its Enter / Next listeners wait for the next question
    const romaji = { 'アイス': 'aisu', 'ソース': 'soosu' }[displayed()];
    expect(romaji).toBeDefined();
    romaji.split('').forEach(key => fireEvent.keyDown(window, { key }));
    expect(document.querySelector('#in-game-next-button')).not.toHaveClass('hidden-element');

    await act(async () => {
      router.navigate(-1);
    });
    expect(path()).toBe('/');

    // A leftover listener would run against the game screen that is gone
    const errors = [];
    const onError = (event) => {
      errors.push(event.error);
      event.preventDefault();
    };
    window.addEventListener('error', onError);
    const userStats = localStorage.getItem('userStats');
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Enter' });
    });
    window.removeEventListener('error', onError);
    expect(errors).toEqual([]);
    expect(path()).toBe('/');
    expect(localStorage.getItem('userStats')).toBe(userStats);
  });
});

describe('search engines', () => {
  const robots = () => document.querySelector('meta[name="robots"]').content;

  test('the menu is indexed, with a title and description in the app language', async () => {
    await open('/');
    expect(document.title).toBe(translate('en', 'seoTitleMenu'));
    expect(document.querySelector('meta[name="description"]').content).toBe(translate('en', 'seoDescription'));
    expect(robots()).toBe('index, follow');
  });

  test('the title follows the language', async () => {
    localStorage.setItem('language', 'id');
    await open('/');
    expect(document.title).toBe(translate('id', 'seoTitleMenu'));
  });

  test('the game screen is not indexed', async () => {
    await open('/game');
    expect(document.title).toBe(translate('en', 'seoTitleGame'));
    expect(robots()).toBe('noindex, follow');
  });

  test('unknown addresses are not indexed', async () => {
    await open('/nothing-here');
    expect(document.title).toBe(translate('en', 'seoTitleNotFound'));
    expect(robots()).toBe('noindex, follow');
  });
});

describe('practicing mix-ups', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const setConfusions = (confusions) => localStorage.setItem('kanaConfusions', JSON.stringify(confusions));
  const recent = (count) => ({ count, last: Date.now() - DAY });

  test('the menu has no mix-up banner', async () => {
    setConfusions({ 'ツ': { 'シ': recent(4) } });
    await open('/');
    expect(document.querySelector('.mixup-call')).toBeNull();
  });

  test('a mix-up game shows only those kana, whatever groups are selected', async () => {
    // Only the あ group is selected, the mix-ups are katakana
    setConfusions({ 'ツ': { 'シ': recent(4) }, 'ソ': { 'ン': recent(2) } });
    await open('/game?mode=mixups');
    expect(path()).toBe('/game');
    expect(score()).toHaveTextContent(translate('en', 'gameScoreMixups').trim());
    const shown = new Set();
    for (let round = 0; round < 12; round++) {
      shown.add(displayed());
      // Answer it to move on to the next kana
      const romaji = { 'シ': 'shi', 'ツ': 'tsu', 'ソ': 'so', 'ン': 'n' }[displayed()];
      expect(romaji).toBeDefined();
      await act(async () => {
        romaji.split('').forEach(key => fireEvent.keyDown(window, { key }));
        await new Promise(resolve => setTimeout(resolve, 250));
      });
    }
    expect([...shown].every(kana => ['シ', 'ツ', 'ソ', 'ン'].includes(kana))).toBe(true);
  });

  test('a mix-up game can practice a single pair', async () => {
    setConfusions({ 'ツ': { 'シ': recent(4) }, 'ソ': { 'ン': recent(2) } });
    await open({ pathname: '/game', search: '?mode=mixups', state: { characters: ['ソ', 'ン'] } });
    expect(['ソ', 'ン']).toContain(displayed());
  });

  test('without mix-ups it goes back to the menu and says why', async () => {
    await open('/game?mode=mixups');
    expect(path()).toBe('/');
    expect(screen.getByRole('alert')).toHaveTextContent(translate('en', 'gameErrorNoMixups'));
  });

  test('the summary offers to practice the kana mixed up in that game', async () => {
    await open('/game');
    // Answer the shown vowel with another vowel's reading: a mix-up
    const shownKana = displayed();
    const romaji = { 'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o' };
    const [otherKana, otherRomaji] = Object.entries(romaji).find(([kana]) => kana !== shownKana);
    fireEvent.keyDown(window, { key: otherRomaji });
    fireEvent.keyDown(window, { key: 'Escape' });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 650));
    });

    const call = document.querySelector('.mixup-call-summary');
    expect(call).toHaveTextContent([shownKana, otherKana].sort().join(' ⇄ '));
    await act(async () => {
      fireEvent.click(call.querySelector('button'));
    });
    expect(router.state.location.search).toBe('?mode=mixups');
    expect([shownKana, otherKana]).toContain(displayed());
  });

  test('no call in the summary when nothing was mixed up', async () => {
    await open('/game');
    fireEvent.keyDown(window, { key: 'Escape' });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 650));
    });
    expect(document.querySelector('.inGameUserGameScoreWindow')).toBeInTheDocument();
    expect(document.querySelector('.mixup-call-summary')).toBeNull();
  });
});

describe('About window', () => {
  test('the navbar has no author credit, its GitHub button opens the About window', async () => {
    await open('/');
    expect(document.querySelector('.navbar')).not.toHaveTextContent('Eldoprano');
    expect(screen.queryByRole('dialog', { name: 'Learn Kana' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: translate('en', 'navbarAbout') }));
    const dialog = screen.getByRole('dialog', { name: 'Learn Kana' });
    expect(dialog).toHaveTextContent(translate('en', 'aboutOpenSource'));

    const links = [...dialog.querySelectorAll('a')].map(link => link.getAttribute('href'));
    expect(links).toContain('https://github.com/Yunnie-pin/learn-kana');
    expect(links).toContain('https://github.com/Eldoprano/learn-kana');
    expect(dialog).toHaveTextContent('Yunnie-pin/learn-kana');
    expect(dialog).toHaveTextContent('Eldoprano/learn-kana');
    // Links open in a new tab, the app stays where it was
    dialog.querySelectorAll('a').forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    });
    // The close button gets the focus, for keyboard users
    expect(document.activeElement).toBe(screen.getByRole('button', { name: translate('en', 'aboutClose') }));
  });

  test('closes with Escape, the close button or a click outside', async () => {
    await open('/');
    const openAbout = () => fireEvent.click(screen.getByRole('button', { name: translate('en', 'navbarAbout') }));

    openAbout();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    openAbout();
    fireEvent.click(screen.getByRole('button', { name: translate('en', 'aboutClose') }));
    expect(screen.queryByRole('dialog')).toBeNull();

    openAbout();
    fireEvent.click(document.querySelector('.about-dialog-background'));
    expect(screen.queryByRole('dialog')).toBeNull();

    // A click inside the window keeps it open
    openAbout();
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('in Indonesian', async () => {
    localStorage.setItem('language', 'id');
    await open('/');
    fireEvent.click(screen.getByRole('button', { name: translate('id', 'navbarAbout') }));
    expect(screen.getByRole('dialog')).toHaveTextContent(translate('id', 'aboutForkedFrom'));
  });
});

test('the Learning Progress tooltip shows the mastery and what lowers it', async () => {
  const DAY = 24 * 60 * 60 * 1000;
  // あ: right 3 times out of 3 in 0.86s, 14 days ago (100% accuracy, 83% mastery)
  localStorage.setItem('userStats', JSON.stringify({
    'あ': {
      totalTimesShown: 3,
      totalRightGuesses: 3,
      totalWrongGuesses: 0,
      totaltotalResponseTime: 2580,
      dailyPerformance: [{ date: Date.now() - 14 * DAY, rightGuesses: 3, wrongGuesses: 0, responseTimeSum: 2580 }],
    },
  }));
  await open('/');
  fireEvent.click(document.querySelector('.stats-button-floating'));
  const tile = [...document.querySelectorAll('.progress-stats-grid-item')].find(item => item.textContent.startsWith('あ'));
  fireEvent.mouseEnter(tile);

  const tooltip = document.querySelector('.progress-stats-tooltip');
  expect(tooltip).toHaveTextContent(translate('en', 'masteryValue', { percent: 83 }));
  expect(tooltip).toHaveTextContent(translate('en', 'statsAccuracy', { percent: 100 }));
  const reasons = [...tooltip.querySelectorAll('.progress-stats-tooltip-mastery-reasons li')].map(li => li.textContent);
  expect(reasons).toEqual([
    translate('en', 'masteryLossExperience', { count: 3, needed: 20 }) + '−9',
    translate('en', 'masteryLossRetention', { days: 14 }) + '−6',
    translate('en', 'masteryLossSpeed', { seconds: '0.86' }) + '−3',
  ]);
});

test('the menu fades the edge of the mode options while more are hidden below', async () => {
  await open('/');
  const side = document.querySelector('.game-menu-side');
  const options = document.querySelector('.game-mode-selector');
  // jsdom has no layout: give the options list a size
  Object.defineProperty(options, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(options, 'clientHeight', { configurable: true, value: 300 });

  options.scrollTop = 0;
  fireEvent.scroll(options);
  expect(side).toHaveClass('has-more-below');

  options.scrollTop = 700;
  fireEvent.scroll(options);
  expect(side).not.toHaveClass('has-more-below');
});

describe('character order', () => {
  const romaji = { 'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o', 'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko' };
  async function answerShown() {
    await act(async () => {
      romaji[displayed()].split('').forEach(key => fireEvent.keyDown(window, { key }));
      await new Promise(resolve => setTimeout(resolve, 250));
    });
  }

  test('in order: the kana table order, starting again at the end', async () => {
    practiceCharacters(['あ', 'か']);
    localStorage.setItem('game-mode-order', 'sequential');
    await open('/game');
    const shown = [];
    for (let round = 0; round < 12; round++) {
      shown.push(displayed());
      await answerShown();
    }
    expect(shown.join('')).toBe('あいうえおかきくけこあい');
  });

  test('random: not the table order', async () => {
    practiceCharacters(['あ', 'か']);
    localStorage.setItem('game-mode-order', 'random');
    await open('/game');
    const shown = [];
    for (let round = 0; round < 10; round++) {
      shown.push(displayed());
      await answerShown();
    }
    // 10 random picks matching the table order by chance is (1/10)^9
    expect(shown.join('')).not.toBe('あいうえおかきくけこ');
  });

  test('Try Problematics keeps picking what needs practice, even in order mode', async () => {
    practiceCharacters(['あ']);
    localStorage.setItem('game-mode-order', 'sequential');
    await open({ pathname: '/game', state: { characters: ['お'] } });
    expect(displayed()).toBe('お');
  });
});

test('words practice with the IT topic only shows IT words', async () => {
  const allKanaGroups = ['hiragana', 'katakana'].flatMap(script => Object.values(kanaCharacters[script]).map(group => group.title));
  const itWords = Object.values(kanaCharacters.words).filter(word => (word.tags || []).includes('it'));
  localStorage.setItem('checkedKanas', JSON.stringify(allKanaGroups));
  localStorage.setItem('game-mode-practice', 'words');
  localStorage.setItem('game-mode-word', 'true');
  localStorage.setItem('game-mode-word-topic', 'it');
  await open('/game');
  for (let round = 0; round < 8; round++) {
    const word = itWords.find(item => item.jp_character === displayed());
    expect(word).toBeDefined();
    await act(async () => {
      word.romanji[0].split('').forEach(key => fireEvent.keyDown(window, { key }));
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Enter' });
    });
  }
});

test('sentence practice with the IT topic only shows IT sentences', async () => {
  const allGroups = ['hiragana', 'katakana', 'kanji'].flatMap(script =>
    Object.values(kanaCharacters[script] || {}).map(group => group.title));
  const itSentences = sentences.filter(sentence => sentence.topic === 'it');
  localStorage.setItem('checkedKanas', JSON.stringify(allGroups));
  localStorage.setItem('game-mode-practice', 'long');
  localStorage.setItem('game-mode-sentence-topic', 'it');
  await open('/game');
  for (let round = 0; round < 3; round++) {
    const sentence = itSentences.find(item => item.jp_character === displayed());
    expect(sentence).toBeDefined();
    await act(async () => {
      sentence.romanji[0].replace(/[- ]/g, '').split('').forEach(key => fireEvent.keyDown(window, { key }));
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Enter' });
    });
  }
});

test('grammar practice hides the verb form at the end of a real sentence', async () => {
  const allGroups = ['hiragana', 'katakana', 'kanji'].flatMap(script =>
    Object.values(kanaCharacters[script] || {}).map(group => group.title));
  localStorage.setItem('checkedKanas', JSON.stringify(allGroups));
  localStorage.setItem('game-mode-practice', 'bunpou');
  localStorage.setItem('game-mode-bunpou-answer', 'typing');
  localStorage.setItem('game-mode-auto-next', 'false');

  // The menu counts the sentences with a form the practice can hide
  await open('/');
  expect(document.querySelector('.game-menu-summary'))
    .toHaveTextContent(translate('en', 'menuSummaryBunpou', { count: getBunpouQuestions(allGroups).length }));
  cleanup();

  // The game shows a real sentence with the form at its end masked
  await open('/game');
  expect(displayed()).toContain('？');
  const cursorGroup = () => document.querySelector('#in-game-text-input-cursor-group');

  // Help gives the form away step by step; type it as it comes
  for (let round = 0; round < 5 && !cursorGroup().classList.contains('answer-correct'); round++) {
    await act(async () => {
      fireEvent.keyDown(window, { key: '?' });
    });
    const hint = document.querySelector('#in-game-sentence-hint');
    if (!hint) continue;
    await act(async () => {
      hint.textContent.split('').forEach(key => fireEvent.keyDown(window, { key }));
    });
  }
  // Only the hidden form was typed, and the sentence is revealed with it
  expect(cursorGroup()).toHaveClass('answer-correct');
  expect(score()).toHaveTextContent('1');
  expect(document.querySelector('#in-game-solution')).not.toHaveClass('hidden-element');
  // Counts the grammar questions of every group twice (menu and game): slow
  // when the whole suite runs in parallel
}, 15000);

test('words practice with only kanji groups selected shows kanji words', async () => {
  const kanjiGroups = Object.values(kanaCharacters.kanji).map(group => group.title);
  const kanjiWords = getListOfKanjiWords(kanjiGroups);
  localStorage.setItem('checkedKanas', JSON.stringify(kanjiGroups));
  localStorage.setItem('game-mode-practice', 'words');
  localStorage.setItem('game-mode-word', 'true');

  // The menu counts them
  await open('/');
  expect(document.querySelector('.game-menu-summary')).toHaveTextContent(String(kanjiWords.length));
  expect(document.querySelector('.game-menu-start a')).toBeInTheDocument();
  cleanup();

  // The game shows them and takes their romaji
  await open('/game');
  const word = kanjiWords.find(item => item.jp_character === displayed());
  expect(word).toBeDefined();
  await act(async () => {
    word.romanji[0].split('').forEach(key => fireEvent.keyDown(window, { key }));
  });
  expect(score()).toHaveTextContent('1');
});

describe('kanji readings with kanji words', () => {
  const kanjiGroups = Object.values(kanaCharacters.kanji).map(group => group.title);

  async function answerKanjiWord(readingsOn) {
    localStorage.setItem('checkedKanas', JSON.stringify(kanjiGroups));
    localStorage.setItem('game-mode-practice', 'words');
    localStorage.setItem('game-mode-word', 'true');
    localStorage.setItem('game-mode-kanji-readings', String(readingsOn));
    await open('/game');
    const word = getListOfKanjiWords(kanjiGroups).find(item => item.jp_character === displayed());
    // Not shown before answering: they would give the answer away
    expect(document.querySelector('#in-game-solution')).toHaveClass('hidden-element');
    await act(async () => {
      word.romanji[0].split('').forEach(key => fireEvent.keyDown(window, { key }));
    });
    return word;
  }

  test('on: once answered, every kanji of the word with its on / kun readings', async () => {
    const word = await answerKanjiWord(true);
    const kanji = [...new Set([...word.jp_character])].filter(character => kanjiReadings[character]);
    const blocks = [...document.querySelectorAll('#in-game-solution .kanji-word-reading')];
    expect(blocks.map(block => block.querySelector('.kanji-word-reading-character').textContent)).toEqual(kanji);
    expect(blocks[0]).toHaveTextContent(translate('en', 'kanjiOnShort'));
    expect(blocks[0]).toHaveTextContent(translate('en', 'kanjiKuShort'));
  });

  test('off: no readings', async () => {
    await answerKanjiWord(false);
    expect(document.querySelector('#in-game-solution .kanji-word-reading')).toBeNull();
  });

  test('the hint of a kanji word comes in steps: meanings, readings, then the romaji', async () => {
    localStorage.setItem('checkedKanas', JSON.stringify(kanjiGroups));
    localStorage.setItem('game-mode-practice', 'words');
    localStorage.setItem('game-mode-word', 'true');
    await open('/game');
    const word = getListOfKanjiWords(kanjiGroups).find(item => item.jp_character === displayed());
    const kanji = [...new Set([...word.jp_character])].filter(character => kanjiReadings[character]);
    const first = Object.values(kanaCharacters.kanji).flatMap(group => Object.values(group.characters))
      .find(entry => entry.jp_character === kanji[0]);
    const hint = document.querySelector('#in-game-kana-solution');
    const askForHelp = () => act(async () => {
      fireEvent.keyDown(window, { key: '?' });
    });
    expect(hint).toHaveClass('hidden-element');

    // 1: every kanji with its meaning only
    await askForHelp();
    expect(hint).not.toHaveClass('hidden-element');
    const blocks = [...hint.querySelectorAll('.kanji-word-reading')];
    expect(blocks.map(block => block.querySelector('.kanji-word-reading-character').textContent)).toEqual(kanji);
    expect(blocks[0].querySelector('.kanji-word-hint-meaning')).toHaveTextContent(first.meaning);
    expect(hint.querySelector('.kanji-answer-reading-label')).toBeNull();
    expect(hint.querySelector('.in-game-kana-solution-romaji')).toBeNull();

    // 2: their on / kun readings
    await askForHelp();
    expect(blocks[0]).toHaveTextContent(translate('en', 'kanjiOnShort'));
    expect(blocks[0]).toHaveTextContent(translate('en', 'kanjiKuShort'));
    expect(hint.querySelector('.in-game-kana-solution-romaji')).toBeNull();
    // the reading the word uses stands out, or the word is said to be special
    if (readingsUsedInWord(word.jp_character, word.romanji)) {
      expect(hint.querySelector('.kanji-reading-used')).toBeInTheDocument();
    } else {
      expect(hint).toHaveTextContent(translate('en', 'kanjiSpecialReading'));
    }

    // 3: the romaji of the word
    await askForHelp();
    expect(hint.querySelector('.in-game-kana-solution-romaji')).toHaveTextContent(word.romanji[0]);
  });
});

describe('kanji review (SRS)', () => {
  const kanjiGroups = Object.values(kanaCharacters.kanji).map(group => group.title);
  const card = () => document.querySelector('.kanji-srs-flip-front span')?.textContent;
  const progress = () => JSON.parse(localStorage.getItem('kanji-srs-progress') || '{}');
  const press = async (key) => {
    await act(async () => {
      fireEvent.keyDown(window, { key });
    });
  };

  beforeEach(() => {
    localStorage.setItem('checkedKanas', JSON.stringify(kanjiGroups));
  });

  test('a first review brings in only the new kanji of the day, not all 300', async () => {
    localStorage.setItem('game-mode-practice', 'srs');
    await open('/');
    expect(document.querySelector('.game-menu-summary'))
      .toHaveTextContent(translate('en', 'menuSummarySrs', { due: 0, fresh: NEW_KANJI_PER_DAY }));

    cleanup();
    await open('/game?mode=review');
    const seen = new Set();
    for (let round = 0; round < NEW_KANJI_PER_DAY; round++) {
      seen.add(card());
      await press('ArrowRight');
    }
    expect(seen.size).toBe(NEW_KANJI_PER_DAY);
    // The session is over: the summary
    expect(document.querySelector('.score-button-primary')).toBeInTheDocument();
  });

  test('keyboard: Space turns the card over, 1-4 grade it', async () => {
    await open('/game?mode=review');
    const first = card();
    expect(document.querySelector('.kanji-srs-grade')).toBeNull();

    await press(' ');
    expect(document.querySelector('.kanji-srs-flip-inner')).toHaveClass('is-flipped');
    const grades = [...document.querySelectorAll('.kanji-srs-grade')];
    expect(grades.map(button => button.querySelector('.kanji-srs-grade-name').textContent))
      .toEqual(['Forgot', 'Hard', 'Good', 'Easy']);
    // Each says when the kanji comes back
    expect(grades[0]).toHaveTextContent('10 min');
    expect(grades[3]).toHaveTextContent('4 days');

    await press('4');
    expect(progress()[first].intervalDays).toBe(4);
    expect(card()).not.toBe(first);
  });

  test('a forgotten kanji comes back at the end of the session', async () => {
    await open('/game?mode=review');
    const forgotten = card();
    await press('ArrowLeft');
    expect(progress()[forgotten].lapses).toBe(1);

    const shown = [];
    for (let round = 0; round < NEW_KANJI_PER_DAY; round++) {
      shown.push(card());
      await press('ArrowRight');
    }
    // The other new kanji first, then the forgotten one again
    expect(shown[shown.length - 1]).toBe(forgotten);
    expect(progress()[forgotten].repetitions).toBe(1);
  });

  test('the grade buttons work like the keys', async () => {
    await open('/game?mode=review');
    const first = card();
    fireEvent.click(document.querySelector('.kanji-srs-flip-card'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Hard/ }));
    });
    expect(progress()[first].repetitions).toBe(1);
    expect(card()).not.toBe(first);
  });
});

describe('kanji review in the Practice options', () => {
  const kanjiGroups = Object.values(kanaCharacters.kanji).map(group => group.title);

  test('Practice = Kanji review starts a review from the Start button', async () => {
    localStorage.setItem('checkedKanas', JSON.stringify(kanjiGroups));
    await open('/');
    fireEvent.click(screen.getByRole('tab', { name: translate('en', 'practiceSrs') }));
    expect(localStorage.getItem('game-mode-practice')).toBe('srs');
    // Typing / multiple choice and the readings option don't apply to the cards
    expect(screen.queryByRole('radiogroup', { name: 'Answer by' })).toBeNull();
    expect(document.querySelector('#game-mode-kanji-readings')).toBeNull();
    // The Start button goes to the review
    expect(document.querySelector('.game-menu-start a').getAttribute('href')).toBe('/game?mode=review');
    // No separate review button in the Kanji tab any more
    expect(document.querySelector('.kanji-srs-start')).toBeNull();
  });

  test('without a kanji group there is nothing to review', async () => {
    localStorage.setItem('game-mode-practice', 'srs');
    await open('/');
    expect(document.querySelector('.game-menu-summary')).toHaveTextContent(translate('en', 'menuSummarySrsNoKanji'));
    expect(document.querySelector('.game-menu-start a')).toBeNull();
  });

  test('a plain game while the practice is the kanji review is a review', async () => {
    localStorage.setItem('checkedKanas', JSON.stringify(kanjiGroups));
    localStorage.setItem('game-mode-practice', 'srs');
    await open('/game');
    expect(document.querySelector('.kanji-srs-flip-card')).toBeInTheDocument();
  });
});

describe('kanji review screen', () => {
  const kanjiGroups = Object.values(kanaCharacters.kanji).map(group => group.title);
  const card = () => document.querySelector('.kanji-srs-flip-front span')?.textContent;
  const count = () => document.querySelector('.kanji-srs-session-count').textContent;
  const kind = () => document.querySelector('.kanji-srs-kind').textContent;
  const press = async (key) => {
    await act(async () => {
      fireEvent.keyDown(window, { key });
    });
  };

  beforeEach(() => {
    localStorage.setItem('checkedKanas', JSON.stringify(kanjiGroups));
  });

  test('shows how far the session is and what the card is', async () => {
    await open('/game?mode=review');
    expect(count()).toBe(`1 / ${NEW_KANJI_PER_DAY}`);
    expect(kind()).toBe(translate('en', 'srsKindNew'));

    const forgotten = card();
    await press('ArrowLeft');
    // A forgotten card comes back: one more card in the session
    expect(count()).toBe(`2 / ${NEW_KANJI_PER_DAY + 1}`);
    for (let round = 1; round < NEW_KANJI_PER_DAY; round++) {
      await press('ArrowRight');
    }
    expect(card()).toBe(forgotten);
    expect(kind()).toBe(translate('en', 'srsKindRelearn'));
  });

  test('the summary says what the review did and when the next one is', async () => {
    await open('/game?mode=review');
    await press('ArrowLeft');
    for (let round = 0; round < NEW_KANJI_PER_DAY; round++) {
      await press('ArrowRight');
    }
    const summary = document.querySelector('.srs-summary');
    expect(summary).toBeInTheDocument();
    // 11 cards graded: 10 new kanji (one forgotten, then remembered)
    expect(summary.querySelector('h1')).toHaveTextContent(String(NEW_KANJI_PER_DAY + 1));
    expect(summary.querySelector('.stat-learned strong')).toHaveTextContent(String(NEW_KANJI_PER_DAY));
    expect(summary.querySelector('.stat-forgot strong')).toHaveTextContent('1');
    // Everything learned comes back tomorrow (1 day)
    expect(summary.querySelector('.srs-summary-next'))
      .toHaveTextContent(translate('en', 'srsSummaryNext', { when: translate('en', 'srsSummaryTomorrow'), count: NEW_KANJI_PER_DAY }));
  });

  test('dragging the card says which way means what', async () => {
    Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {});
    await open('/game?mode=review');
    const cardElement = document.querySelector('.kanji-srs-flip-card');
    expect(document.querySelector('.kanji-srs-swipe-hint')).toBeNull();

    // jsdom has no PointerEvent: give the events their position by hand
    const pointer = (type, clientX) => {
      const event = createEvent[type](cardElement, { pointerId: 1 });
      Object.defineProperty(event, 'clientX', { value: clientX });
      fireEvent(cardElement, event);
    };
    pointer('pointerDown', 200);
    pointer('pointerMove', 290);
    expect(document.querySelector('.kanji-srs-swipe-hint')).toHaveTextContent(translate('en', 'srsGradeGood'));
    expect(document.querySelector('.kanji-srs-swipe-hint').style.opacity).toBe('1');

    pointer('pointerMove', 170);
    const hint = document.querySelector('.kanji-srs-swipe-hint');
    expect(hint).toHaveTextContent(translate('en', 'srsGradeAgain'));
    expect(Number(hint.style.opacity)).toBeCloseTo(0.5);
  });
});

describe('labels follow what is practiced', () => {
  test('score and summary title for characters, words and sentences', async () => {
    const cases = [
      ['characters', ['あ'], 'gameScoreKanas', 'summaryCompletedKanas'],
      ['words', ['ア', 'サ'], 'gameScoreWords', 'summaryCompletedWords'],
    ];
    for (const [practice, groups, scoreKey, titleKey] of cases) {
      localStorage.setItem('checkedKanas', JSON.stringify(groups));
      localStorage.setItem('game-mode-practice', practice);
      localStorage.setItem('game-mode-word', String(practice === 'words'));
      await open('/game');
      expect(score()).toHaveTextContent(translate('en', scoreKey).trim());
      fireEvent.keyDown(window, { key: 'Escape' });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 650));
      });
      expect(document.querySelector('.inGameUserGameScoreWindow_header h2')).toHaveTextContent(translate('en', titleKey));
      cleanup();
    }
  });
});

describe('kanji review once today\'s new kanji are done', () => {
  const groups = Object.values(kanaCharacters.kanji);
  const selected = groups.filter(group => /^N5 (Numbers|Activities)/.test(group.title));
  const summary = () => document.querySelector('.game-menu-summary').textContent;

  beforeEach(() => {
    localStorage.setItem('checkedKanas', JSON.stringify(selected.map(group => group.title)));
    localStorage.setItem('game-mode-practice', 'srs');
  });

  test('says so instead of "no kanji due", and Start brings in more new kanji', async () => {
    // 10 new kanji already learned today, from another group
    const other = groups.find(group => group.title.startsWith('N4'));
    Object.values(other.characters).forEach(character => recordKanjiSrsAnswer(character.jp_character, 'good'));

    await open('/');
    expect(summary()).toBe(translate('en', 'menuSummarySrsMoreNew', { count: NEW_KANJI_PER_DAY }));
    const start = document.querySelector('.game-menu-start button');
    expect(start).toBeEnabled();

    await act(async () => {
      fireEvent.click(start);
    });
    expect(router.state.location.search).toBe('?mode=review');
    expect(document.querySelector('.kanji-srs-session-count')).toHaveTextContent(`1 / ${NEW_KANJI_PER_DAY}`);
  });

  test('when every kanji is learned and none is due: when the next review is', async () => {
    selected.forEach(group => Object.values(group.characters)
      .forEach(character => recordKanjiSrsAnswer(character.jp_character, 'good')));
    await open('/');
    expect(summary()).toBe(translate('en', 'menuSummarySrsCaughtUp', {
      when: translate('en', 'srsSummaryTomorrow'),
      count: selected.reduce((sum, group) => sum + Object.keys(group.characters).length, 0),
    }));
    expect(document.querySelector('.game-menu-start a')).toBeNull();
  });
});

test('the review summary offers more new kanji once today\'s are done', async () => {
  localStorage.setItem('checkedKanas', JSON.stringify(Object.values(kanaCharacters.kanji).map(group => group.title)));
  await open('/game?mode=review');
  for (let round = 0; round < NEW_KANJI_PER_DAY; round++) {
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });
  }
  const more = document.querySelector('.srs-summary .score-button-primary');
  expect(more).toHaveTextContent(translate('en', 'srsSummaryLearnMore', { count: NEW_KANJI_PER_DAY }));
  await act(async () => {
    fireEvent.click(more);
  });
  expect(document.querySelector('.srs-summary')).toBeNull();
  expect(document.querySelector('.kanji-srs-session-count')).toHaveTextContent(`1 / ${NEW_KANJI_PER_DAY}`);
});

test('Learning Progress loads the sentences when their tab is opened, not with the menu', async () => {
  const today = new Date().setHours(0, 0, 0, 0);
  localStorage.setItem('userStats', JSON.stringify({
    'これは水です': { totalRightGuesses: 1, dailyPerformance: [{ date: today, rightGuesses: 1, wrongGuesses: 0, askForHelpCounter: 0, responseTimeSum: 2000 }] },
  }));
  await open('/');
  fireEvent.click(screen.getAllByTitle(translate('en', 'menuStats'))[0]);
  const statsTab = [...document.querySelectorAll('.progress-stats-tab')]
    .find(tab => tab.textContent === translate('en', 'practiceLong'));
  fireEvent.click(statsTab);
  // The practiced sentence, once the sentences are loaded
  expect(await screen.findByText('これは水です')).toBeInTheDocument();
  expect(screen.queryByText(translate('en', 'statsSentencesEmpty'))).toBeNull();
});

describe('tabs', () => {
  test('the root is the Games tab, the navbar links to the Dictionary', async () => {
    await open('/');
    const games = screen.getByRole('link', { name: translate('en', 'tabGames') });
    const dictionary = screen.getByRole('link', { name: translate('en', 'tabDictionary') });
    expect(games).toHaveAttribute('aria-current', 'page');
    expect(dictionary).not.toHaveAttribute('aria-current');

    await act(async () => {
      fireEvent.click(dictionary);
    });
    expect(path()).toBe('/dictionary');
    expect(screen.getByRole('link', { name: translate('en', 'tabDictionary') })).toHaveAttribute('aria-current', 'page');

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: translate('en', 'tabGames') }));
    });
    expect(path()).toBe('/');
    expect(document.getElementById('game-menu-title')).toBeInTheDocument();
  });

  test('the navbar links to the Materials page, with its particles and grammar', async () => {
    await open('/');
    const materi = screen.getByRole('link', { name: translate('en', 'tabMateri') });
    await act(async () => {
      fireEvent.click(materi);
    });
    expect(path()).toBe('/materi');
    expect(screen.getByRole('link', { name: translate('en', 'tabMateri') })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe(translate('en', 'seoTitleMateri'));
    expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow');

    // The particles are the section shown first, the filter switches to grammar
    expect(document.querySelector('.materi-list')).toHaveTextContent('は');
    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'materiBunpou') }));
    expect(document.querySelector('.materi-list')).toHaveTextContent('〜です');
    expect(screen.getByRole('radio', { name: translate('en', 'materiBunpou') })).toHaveAttribute('aria-checked', 'true');
  });

  test('the navbar links to the Chat tab, next to the Materials', async () => {
    await open('/');
    const chat = screen.getByRole('link', { name: translate('en', 'tabChat') });
    await act(async () => {
      fireEvent.click(chat);
    });
    expect(path()).toBe('/chat');
    expect(screen.getByRole('link', { name: translate('en', 'tabChat') })).toHaveAttribute('aria-current', 'page');
    expect(document.title).toBe(translate('en', 'seoTitleChat'));
    expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow');

    // The chat of the tab, not a section of the Materials any more
    expect(document.querySelector('.materi-chat')).not.toBeNull();
    expect(document.querySelector('.materi-list')).toBeNull();
    expect(screen.getByPlaceholderText(translate('en', 'chatInputPlaceholder'))).toBeInTheDocument();
  });

  test('the dictionary searches and filters', async () => {
    await open('/dictionary');
    expect(document.title).toBe(translate('en', 'seoTitleDictionary'));
    expect(document.querySelector('meta[name="robots"]').content).toBe('index, follow');

    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'dictionaryKanji') }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'water' } });
    const first = document.querySelector('.dictionary-entry');
    expect(first.querySelector('.dictionary-entry-character')).toHaveTextContent('水');
    expect(first).toHaveTextContent('スイ');
    expect(first).toHaveTextContent('みず');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzqqq' } });
    expect(screen.getByText(translate('en', 'dictionaryEmpty'))).toBeInTheDocument();
  });

  test('the dictionary filters kanji by category, the categories of the level picked', async () => {
    await open('/dictionary');
    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'dictionaryKanji') }));
    const categorySelect = () => screen.getByRole('combobox', { name: translate('en', 'dictionaryCategory') });
    const levelSelect = screen.getByRole('combobox', { name: translate('en', 'dictionaryLevel') });
    const shownKanji = () => [...document.querySelectorAll('.dictionary-entry-character')].map(element => element.textContent);

    // Every level's categories, until one level is picked
    const n5 = kanjiLevels.find(item => item.level === 'N5');
    const n4 = kanjiLevels.find(item => item.level === 'N4');
    expect(within(categorySelect()).getAllByRole('option')).toHaveLength(1 + n5.categories.length + n4.categories.length);
    fireEvent.change(levelSelect, { target: { value: 'N5' } });
    expect(within(categorySelect()).getAllByRole('option')).toHaveLength(1 + n5.categories.length);
    expect(within(categorySelect()).getByRole('option', { name: 'Numbers' })).toBeInTheDocument();

    // Only the kanji of the category
    const numbers = n5.categories.find(category => category.key === 'n5-numbers');
    fireEvent.change(categorySelect(), { target: { value: numbers.title } });
    expect(shownKanji().sort()).toEqual(numbers.kanji.map(entry => entry.jp_character).sort());

    // Another level: its categories do not have that one, so all of them again
    fireEvent.change(levelSelect, { target: { value: 'N4' } });
    expect(categorySelect()).toHaveValue('all');
    expect(shownKanji()).not.toContain('一');
  });

  test('the dictionary shows the meanings in Indonesian', async () => {
    localStorage.setItem('language', 'id');
    await open('/dictionary');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'kawaii' } });
    expect(document.querySelector('.dictionary-entry')).toHaveTextContent('imut');
  });

  test('a Learning Progress notification opens it on the Games tab', async () => {
    await open('/dictionary');
    await act(async () => {
      router.navigate('/', { state: { openProgress: true } });
    });
    expect(document.querySelector('.progress-stats-modal')).toBeInTheDocument();
    expect(router.state.location.state).toBeNull();
  });
});

describe('practicing from the Dictionary', () => {
  const search = (value) => fireEvent.change(screen.getByRole('searchbox'), { target: { value } });

  test('an entry is practiced even when its groups are not selected in the menu', async () => {
    // Only the あ group is selected, and multiple choice is on
    localStorage.setItem('game-mode-touch', 'true');
    await open('/dictionary');
    search('kawaii');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: `${translate('en', 'dictionaryPractice')}: かわいい` }));
    });
    expect(path()).toBe('/game');
    expect(displayed()).toBe('かわいい');
    // Typed, not multiple choice: one entry has no wrong options
    expect(document.querySelector('.in-game-touch-answer')).toBeNull();
    await act(async () => {
      'kawaii'.split('').forEach(key => fireEvent.keyDown(window, { key }));
    });
    expect(score()).toHaveTextContent('1');

    // Play again practices it again
    fireEvent.keyDown(window, { key: 'Escape' });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 650));
    });
    await act(async () => {
      fireEvent.click(document.querySelector('.score-button-primary'));
    });
    expect(displayed()).toBe('かわいい');
  });

  test('Practice these: the results of a search', async () => {
    await open('/dictionary');
    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'dictionaryKana') }));
    search('ka');
    await act(async () => {
      fireEvent.click(document.querySelector('.dictionary-practice'));
    });
    expect(router.state.location.state.characters).toEqual(expect.arrayContaining(['か', 'カ']));
    expect(['か', 'カ', 'が', 'ガ']).toContain(displayed());
  });

  test('the search and filter are kept when coming back to the tab', async () => {
    await open('/dictionary');
    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'dictionaryKanji') }));
    search('water');
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: translate('en', 'tabGames') }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: translate('en', 'tabDictionary') }));
    });
    expect(screen.getByRole('searchbox')).toHaveValue('water');
    expect(screen.getByRole('radio', { name: translate('en', 'dictionaryKanji') })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Dictionary: progress, filters and links', () => {
  const search = (value) => fireEvent.change(screen.getByRole('searchbox'), { target: { value } });
  const pickType = (key) => fireEvent.click(screen.getByRole('radio', { name: translate('en', key) }));
  // Cards and kana chips, in the order shown
  const entries = () => [...document.querySelectorAll('.dictionary-entry-character, .dictionary-kana-chip .dictionary-kana-cell-character')].map(element => element.textContent);

  test('shows the mastery and the kanji review stage', async () => {
    localStorage.setItem('userStats', JSON.stringify({
      'あ': { totalTimesShown: 3, totalRightGuesses: 3, totalWrongGuesses: 0, totaltotalResponseTime: 2580,
        dailyPerformance: [{ date: Date.now(), rightGuesses: 3, wrongGuesses: 0, responseTimeSum: 2580 }] },
    }));
    recordKanjiSrsAnswer('水', 'good');
    await open('/dictionary');
    search('あ');
    // A kana chip shows the bar, its details the mastery
    const chip = screen.getByRole('button', { name: 'あ a' });
    expect(chip.querySelector('.dictionary-mastery-bar')).toBeInTheDocument();
    fireEvent.click(chip);
    expect(screen.getByRole('dialog')).toHaveTextContent(/Mastery: \d+%/);
    fireEvent.keyDown(window, { key: 'Escape' });
    search('water');
    expect(document.querySelector('.dictionary-entry')).toHaveTextContent(translate('en', 'srsStageLearning'));
  });

  test('Needs practice keeps what is below 80% mastery', async () => {
    const DAY = 24 * 60 * 60 * 1000;
    const stats = (right, wrong) => ({ totalTimesShown: right + wrong, totalRightGuesses: right, totalWrongGuesses: wrong,
      totaltotalResponseTime: 1000 * right, dailyPerformance: [{ date: Date.now() - DAY, rightGuesses: right, wrongGuesses: wrong, responseTimeSum: 1000 * right }] });
    localStorage.setItem('userStats', JSON.stringify({ 'か': stats(1, 5) }));
    await open('/dictionary');
    fireEvent.click(screen.getByRole('checkbox', { name: translate('en', 'dictionaryWeakOnly') }));
    expect(entries()).toEqual(['か']);
    // Practice these: just that one
    await act(async () => {
      fireEvent.click(document.querySelector('.dictionary-practice'));
    });
    expect(displayed()).toBe('か');
  });

  test('level and topic filters', async () => {
    await open('/dictionary');
    pickType('dictionaryKanji');
    fireEvent.change(screen.getByRole('combobox', { name: translate('en', 'dictionaryLevel') }), { target: { value: 'N4' } });
    expect(document.querySelector('.dictionary-entry-kind')).toHaveTextContent('N4');
    expect([...document.querySelectorAll('.dictionary-entry-kind')].every(kind => kind.textContent.endsWith('N4'))).toBe(true);

    pickType('dictionaryWords');
    fireEvent.change(screen.getByRole('combobox', { name: translate('en', 'wordTopicLabel') }), { target: { value: 'it' } });
    const itWords = getDictionaryEntries().filter(item => (item.tags || []).includes('it'));
    expect(document.querySelector('.dictionary-count')).toHaveTextContent(String(itWords.length));
  });

  test('a kanji in a word opens its entry', async () => {
    await open('/dictionary');
    search('suiyoubi');
    const link = screen.getAllByRole('button', { name: '水' })[0];
    fireEvent.click(link);
    expect(screen.getByRole('searchbox')).toHaveValue('水');
    expect(document.querySelector('.dictionary-entry')).toHaveClass('dictionary-entry-kanji');
  });

  test('Kana without a search is the gojūon table; a tap opens the kana', async () => {
    await open('/dictionary');
    pickType('dictionaryKana');
    expect(document.querySelectorAll('.dictionary-kana-table')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'ぬ nu' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('ぬ');
  });
});

describe('Dictionary home', () => {
  test('before a search: shortcuts and a kanji and a word of the day, not the whole list', async () => {
    await open('/dictionary');
    expect(document.querySelectorAll('.dictionary-entry')).toHaveLength(2);
    expect(document.querySelector('.dictionary-entry-kanji')).toBeInTheDocument();
    expect(document.querySelector('.dictionary-entry-word')).toBeInTheDocument();
    // No "Needs practice" shortcut without practice
    expect(screen.queryByRole('button', { name: new RegExp(translate('en', 'dictionaryWeakOnly')) })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(translate('en', 'dictionaryShortcutKanji', { level: 'N4' })) }));
    expect(screen.getByRole('radio', { name: translate('en', 'dictionaryKanji') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('combobox', { name: translate('en', 'dictionaryLevel') })).toHaveValue('N4');
    expect([...document.querySelectorAll('.dictionary-entry-kind')].every(kind => kind.textContent.endsWith('N4'))).toBe(true);
  });

  test('"/" puts the cursor in the search, but not while typing elsewhere', async () => {
    await open('/dictionary');
    const input = screen.getByRole('searchbox');
    expect(input).not.toHaveFocus();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(input).toHaveFocus();
  });
});

describe('Dictionary results and details', () => {
  const search = (value) => fireEvent.change(screen.getByRole('searchbox'), { target: { value } });

  test('All results are grouped by type, with See all for the long ones', async () => {
    await open('/dictionary');
    search('ka');
    const groups = [...document.querySelectorAll('.dictionary-group h2')].map(heading => heading.firstChild.textContent.trim());
    expect(groups).toEqual(expect.arrayContaining([translate('en', 'dictionaryKana'), translate('en', 'dictionaryWords')]));
    // Kana are chips, not cards
    expect(document.querySelector('.dictionary-entry-kana')).toBeNull();
    expect(screen.getByRole('button', { name: 'か ka' })).toBeInTheDocument();

    const seeAllWords = [...document.querySelectorAll('.dictionary-group')]
      .find(group => group.getAttribute('aria-label') === translate('en', 'dictionaryWords'))
      .querySelector('.dictionary-see-all');
    fireEvent.click(seeAllWords);
    expect(screen.getByRole('radio', { name: translate('en', 'dictionaryWords') })).toHaveAttribute('aria-checked', 'true');
  });

  test('the matched part is highlighted', async () => {
    await open('/dictionary');
    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'dictionaryKanji') }));
    search('wat');
    expect(document.querySelector('.dictionary-entry .dictionary-match')).toHaveTextContent('wat');
  });

  test('a word with kanji has its reading above (furigana)', async () => {
    await open('/dictionary');
    search('suiyoubi');
    const ruby = document.querySelector('.dictionary-entry-word ruby');
    expect(ruby.querySelector('rt')).toHaveTextContent('すいようび');
  });

  test('details: sentences, words with the kanji, and back and forth between them', async () => {
    await open('/dictionary');
    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'dictionaryKanji') }));
    search('water');
    fireEvent.click(document.querySelector('.dictionary-entry .dictionary-entry-details'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(translate('en', 'dictionarySentences'));
    expect(dialog).toHaveTextContent(translate('en', 'dictionaryWordsWith', { kanji: '水' }));

    fireEvent.click(within(dialog).getByRole('button', { name: /^水曜日/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent(translate('en', 'dictionaryKanjiOfWord'));
    expect(screen.getByRole('dialog').querySelector('rt')).toHaveTextContent('すいようび');

    fireEvent.click(screen.getByRole('button', { name: translate('en', 'aboutClose') }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('no results: spellings that exist, and the count in the other types', async () => {
    await open('/dictionary');
    search('watr');
    fireEvent.click(screen.getByRole('button', { name: 'water' }));
    expect(screen.getByRole('searchbox')).toHaveValue('water');

    fireEvent.click(screen.getByRole('radio', { name: translate('en', 'dictionaryKana') }));
    search('water');
    fireEvent.click(screen.getByRole('button', { name: /found in All/ }));
    expect(screen.getByRole('radio', { name: translate('en', 'dictionaryAll') })).toHaveAttribute('aria-checked', 'true');
  });

  test('searches are remembered and shown before the next search', async () => {
    vi.useFakeTimers();
    try {
      await open('/dictionary');
      search('mizu');
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      search('');
      const recent = screen.getByRole('region', { name: translate('en', 'dictionaryRecent') });
      fireEvent.click(within(recent).getByRole('button', { name: 'mizu' }));
      expect(screen.getByRole('searchbox')).toHaveValue('mizu');

      search('');
      fireEvent.click(screen.getByRole('button', { name: translate('en', 'dictionaryRecentClear') }));
      expect(screen.queryByRole('region', { name: translate('en', 'dictionaryRecent') })).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
