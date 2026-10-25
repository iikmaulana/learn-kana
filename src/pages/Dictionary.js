import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { DictionaryEntry, KanaChip, WEAK_MASTERY } from '../components/DictionaryEntry';
import DictionaryDetail from '../components/DictionaryDetail';
import { useLanguage } from '../i18n';
import { ROUTES } from '../routes';
import { readUserStats } from '../storage';
import { calculateMastery } from '../mastery';
import { getKanjiSrsProgress, getKanjiSrsStage } from '../kanjiSrs';
import {
  addToSearchHistory,
  clearSearchHistory,
  getDictionaryEntries,
  getKanaTable,
  getSpellingSuggestions,
  getKanjiCategories,
  getWordTopics,
  readSearchHistory,
  searchDictionary,
  topicLabel,
} from '../dictionary';

// Entries shown at first, and added by each "Show more"
const PAGE_SIZE = 60;
// "All" results are grouped by type: this many of each, then "See all"
const SECTION_SIZE = { kana: 15, kanji: 4, word: 6 };
// "Practice these" takes the first results, up to this many
export const PRACTICE_LIMIT = 50;
// The search and filters, kept while the user is on the Games tab or in a game
const SEARCH_KEY = 'dictionary-search';
// A search is remembered once the user stopped typing for this long
const HISTORY_DELAY = 1500;
const DAY = 24 * 60 * 60 * 1000;

const TYPES = [
  { value: 'all', label: 'dictionaryAll' },
  { value: 'kana', label: 'dictionaryKana' },
  { value: 'kanji', label: 'dictionaryKanji' },
  { value: 'word', label: 'dictionaryWords' },
];
const TYPE_LABELS = { kana: 'dictionaryKana', kanji: 'dictionaryKanji', word: 'dictionaryWords' };
const LEVELS = ['all', 'N5', 'N4'];

const DEFAULT_SEARCH = { query: '', type: 'all', level: 'all', category: 'all', topic: 'all', weakOnly: false };

function readSearch() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SEARCH_KEY)) || {};
    return {
      query: typeof saved.query === 'string' ? saved.query : '',
      type: TYPES.some(option => option.value === saved.type) ? saved.type : 'all',
      level: LEVELS.includes(saved.level) ? saved.level : 'all',
      category: getKanjiCategories().some(category => category.title === saved.category) ? saved.category : 'all',
      topic: saved.topic === 'all' || getWordTopics().includes(saved.topic) ? saved.topic : 'all',
      weakOnly: saved.weakOnly === true,
    };
  } catch (error) {
    return DEFAULT_SEARCH;
  }
}

// The same entry all day, another one tomorrow
function entryOfTheDay(type, now = Date.now()) {
  const entries = getDictionaryEntries().filter(entry => entry.type === type);
  const day = Math.floor((now - new Date(now).getTimezoneOffset() * 60 * 1000) / DAY);
  // A step that is prime to the list length goes through every entry
  return entries[(day * 7919) % entries.length];
}

// Hiragana and katakana in the order of the gojūon table; a tap opens the kana
function KanaTables({ masteryOf, onOpen }) {
  const { t } = useLanguage();
  return (
    <div className='dictionary-kana-tables'>
      {['hiragana', 'katakana'].map(script => (
        <section key={script} className='dictionary-kana-table' aria-label={t(script === 'hiragana' ? 'dictionaryHiragana' : 'dictionaryKatakana')}>
          <h2>{t(script === 'hiragana' ? 'dictionaryHiragana' : 'dictionaryKatakana')}</h2>
          <div className='dictionary-kana-grid'>
            {getKanaTable(script).flatMap(({ row, cells }) => cells.map((entry, index) => entry
              ? <KanaChip key={entry.id} entry={entry} mastery={masteryOf(entry)} onOpen={onOpen} />
              : <span key={`${row}-${index}`} className='dictionary-kana-cell is-empty' />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Results: kana as small chips, kanji and words as cards
function EntryList({ entries, query, entryProps }) {
  const kana = entries.filter(entry => entry.type === 'kana');
  const others = entries.filter(entry => entry.type !== 'kana');
  return (
    <>
      {kana.length > 0 && (
        <div className='dictionary-kana-chips'>
          {kana.map(entry => <KanaChip key={entry.id} entry={entry} {...entryProps(entry)} />)}
        </div>
      )}
      {others.length > 0 && (
        <ul className='dictionary-list'>
          {others.map(entry => <DictionaryEntry key={entry.id} entry={entry} query={query} {...entryProps(entry)} />)}
        </ul>
      )}
    </>
  );
}

// "All" results grouped by type, in the order of their best match
function GroupedResults({ results, query, entryProps, onSeeAll }) {
  const { t } = useLanguage();
  const types = [...new Set(results.map(entry => entry.type))];
  return types.map(type => {
    const ofType = results.filter(entry => entry.type === type);
    return (
      <section key={type} className='dictionary-group' aria-label={t(TYPE_LABELS[type])}>
        <div className='dictionary-group-header'>
          <h2>{t(TYPE_LABELS[type])} <span className='dictionary-group-count'>{ofType.length}</span></h2>
          {ofType.length > SECTION_SIZE[type] && (
            <button type='button' className='dictionary-see-all' onClick={() => onSeeAll(type)}>
              {t('dictionarySeeAll', { count: ofType.length })}
              <Icon name='arrow-right' />
            </button>
          )}
        </div>
        <EntryList entries={ofType.slice(0, SECTION_SIZE[type])} query={query} entryProps={entryProps} />
      </section>
    );
  });
}

// Before a search: ways in (kana table, kanji by level, word topics, what
// needs practice), the last searches, and a kanji and a word of the day
function DictionaryHome({ weakCount, history, onBrowse, onSearch, onClearHistory, entryProps }) {
  const { t } = useLanguage();
  const shortcuts = useMemo(() => {
    const entries = getDictionaryEntries();
    const count = (test) => entries.filter(test).length;
    return [
      { key: 'kana', icon: 'grid', label: t('dictionaryShortcutKana'), count: count(entry => entry.type === 'kana'), search: { type: 'kana' } },
      ...['N5', 'N4'].map(level => ({
        key: `kanji-${level}`, icon: 'pen', label: t('dictionaryShortcutKanji', { level }),
        count: count(entry => entry.type === 'kanji' && entry.level === level), search: { type: 'kanji', level },
      })),
      { key: 'words', icon: 'book-open', label: t('dictionaryShortcutWords'), count: count(entry => entry.type === 'word'), search: { type: 'word' } },
      { key: 'it', icon: 'keyboard', label: t('wordTopicIt'), count: count(entry => (entry.tags || []).includes('it')), search: { type: 'word', topic: 'it' } },
      ...(weakCount > 0 ? [{ key: 'weak', icon: 'target', label: t('dictionaryWeakOnly'), count: weakCount, search: { weakOnly: true }, weak: true }] : []),
    ];
  }, [t, weakCount]);
  const daily = [entryOfTheDay('kanji'), entryOfTheDay('word')];

  return (
    <div className='dictionary-home'>
      <nav className='dictionary-shortcuts' aria-label={t('dictionaryBrowse')}>
        {shortcuts.map(shortcut => (
          <button
            key={shortcut.key}
            type='button'
            className={'dictionary-shortcut' + (shortcut.weak ? ' is-weak' : '')}
            onClick={() => onBrowse(shortcut.search)}
          >
            <Icon name={shortcut.icon} />
            <span className='dictionary-shortcut-label'>{shortcut.label}</span>
            <span className='dictionary-shortcut-count'>{shortcut.count}</span>
          </button>
        ))}
      </nav>
      {history.length > 0 && (
        <section className='dictionary-history' aria-label={t('dictionaryRecent')}>
          <div className='dictionary-group-header'>
            <h2>{t('dictionaryRecent')}</h2>
            <button type='button' className='dictionary-see-all' onClick={onClearHistory}>{t('dictionaryRecentClear')}</button>
          </div>
          <div className='dictionary-chips'>
            {history.map(item => (
              <button key={item} type='button' className='dictionary-chip' onClick={() => onSearch(item)}>
                <Icon name='rotate-ccw' />
                {item}
              </button>
            ))}
          </div>
        </section>
      )}
      <h2 className='dictionary-home-title'>{t('dictionaryOfTheDay')}</h2>
      <ul className='dictionary-list'>
        {daily.map(entry => <DictionaryEntry key={entry.id} entry={entry} {...entryProps(entry)} />)}
      </ul>
    </div>
  );
}

// No results: spellings that exist, and the other types when a type is picked
function NoResults({ query, type, weakOnly, onSearch, onShowAll }) {
  const { t } = useLanguage();
  const suggestions = useMemo(() => weakOnly ? [] : getSpellingSuggestions(query), [query, weakOnly]);
  const inOtherTypes = useMemo(
    () => type !== 'all' && query.trim() && !weakOnly ? searchDictionary(query, 'all').length : 0,
    [query, type, weakOnly]
  );
  return (
    <div className='dictionary-empty'>
      <p>{t(weakOnly ? 'dictionaryEmptyWeak' : 'dictionaryEmpty')}</p>
      {suggestions.length > 0 && (
        <p className='dictionary-chips'>
          <span>{t('dictionaryDidYouMean')}</span>
          {suggestions.map(suggestion => (
            <button key={suggestion} type='button' className='dictionary-chip' onClick={() => onSearch(suggestion)}>{suggestion}</button>
          ))}
        </p>
      )}
      {inOtherTypes > 0 && (
        <button type='button' className='dictionary-chip' onClick={onShowAll}>
          {t('dictionaryInAllTypes', { count: inOtherTypes })}
        </button>
      )}
    </div>
  );
}

export default function Dictionary() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState(readSearch);
  const { query, type, level, category, topic, weakOnly } = search;
  const [shown, setShown] = useState(PAGE_SIZE);
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState(readSearchHistory);
  // The input follows every key; the list catches up when the browser has time
  const deferredQuery = useDeferredValue(query);
  const searchInput = useRef(null);

  // What the user knows, read once when the tab opens
  const userStats = useMemo(readUserStats, []);
  const srsProgress = useMemo(getKanjiSrsProgress, []);
  const masteryOf = (entry) => calculateMastery(userStats[entry.jp], entry.jp);
  const srsStageOf = (entry) => entry.type === 'kanji' ? getKanjiSrsStage(srsProgress[entry.jp]) : null;
  const isWeak = useCallback(
    (entry) => Boolean(userStats[entry.jp]) && (calculateMastery(userStats[entry.jp], entry.jp) ?? 100) < WEAK_MASTERY,
    [userStats]
  );
  const weakCount = useMemo(() => getDictionaryEntries().filter(isWeak).length, [isWeak]);

  const results = useMemo(() => searchDictionary(deferredQuery, type).filter(entry =>
    (type !== 'kanji' || level === 'all' || entry.level === level) &&
    (type !== 'kanji' || category === 'all' || entry.category === category) &&
    (type !== 'word' || topic === 'all' || (entry.tags || []).includes(topic)) &&
    (!weakOnly || isWeak(entry))
  ), [deferredQuery, type, level, category, topic, weakOnly, isWeak]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SEARCH_KEY, JSON.stringify(search));
    } catch (error) { }
  }, [search]);

  // A search that found something is remembered once the user stops typing
  const rememberSearch = useCallback(() => {
    if (deferredQuery.trim() && results.length > 0) setHistory(addToSearchHistory(deferredQuery));
  }, [deferredQuery, results.length]);
  useEffect(() => {
    const timer = window.setTimeout(rememberSearch, HISTORY_DELAY);
    return () => window.clearTimeout(timer);
  }, [rememberSearch]);

  // "/" jumps to the search, as on many sites (not while typing somewhere)
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return;
      event.preventDefault();
      searchInput.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // A kanji category in the app's language; the English titles start with
  // their level (N5 Numbers), already said by the group it is listed in
  const categoryLabel = (item) => language === 'id' ? item.title_id : item.title.replace(/^N\d\s+/, '');
  const changeSearch = (changes) => {
    setSearch(previous => ({ ...previous, ...changes }));
    setShown(PAGE_SIZE);
  };
  const searchFor = (text) => {
    changeSearch({ ...DEFAULT_SEARCH, query: text });
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
    document.querySelector('.app-body')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  };
  // A game with these entries, whatever groups are picked in the menu
  // (see isDictionaryPractice in InGameCharacterShowAndInput)
  const practice = (entries) => {
    rememberSearch();
    navigate(ROUTES.game, { state: { characters: entries.map(entry => entry.jp), anyGroup: true } });
  };
  const openDetail = (entry) => {
    rememberSearch();
    setDetail(entry);
  };
  const closeDetail = useCallback(() => setDetail(null), []);
  const lookUp = (text) => {
    setDetail(null);
    searchFor(text);
  };
  const entryProps = (entry) => ({
    mastery: masteryOf(entry),
    srsStage: srsStageOf(entry),
    onPractice: practice,
    onLookUp: lookUp,
    onOpen: openDetail,
  });

  const more = Math.min(PAGE_SIZE, results.length - shown);
  const practiced = results.slice(0, PRACTICE_LIMIT);
  const hasQuery = Boolean(deferredQuery.trim());
  const filtered = hasQuery || weakOnly || (type === 'kanji' && (level !== 'all' || category !== 'all')) || (type === 'word' && topic !== 'all');
  const showHome = type === 'all' && !hasQuery && !weakOnly;
  const showKanaTables = type === 'kana' && !hasQuery && !weakOnly;
  const grouped = type === 'all' && !showHome;

  let content;
  if (showHome) {
    content = (
      <DictionaryHome
        weakCount={weakCount}
        history={history}
        onBrowse={changeSearch}
        onSearch={searchFor}
        onClearHistory={() => setHistory(clearSearchHistory())}
        entryProps={entryProps}
      />
    );
  } else if (showKanaTables) {
    content = <KanaTables masteryOf={masteryOf} onOpen={openDetail} />;
  } else if (results.length === 0) {
    content = <NoResults query={deferredQuery} type={type} weakOnly={weakOnly} onSearch={searchFor} onShowAll={() => changeSearch({ type: 'all' })} />;
  } else if (grouped) {
    content = <GroupedResults results={results} query={deferredQuery} entryProps={entryProps} onSeeAll={(value) => changeSearch({ type: value })} />;
  } else {
    content = <EntryList entries={results.slice(0, shown)} query={deferredQuery} entryProps={entryProps} />;
  }

  return (
    <>
      <main className='dictionary-page'>
        <h1 id='dictionary-title'>{t('dictionaryTitle')}</h1>
        {/* Stays at the top while the results scroll */}
        <div className='dictionary-controls'>
          <div className='dictionary-search'>
            <Icon name='search' className='dictionary-search-icon' />
            <input
              ref={searchInput}
              type='search'
              value={query}
              onChange={(event) => changeSearch({ query: event.target.value })}
              onKeyDown={(event) => event.key === 'Enter' && rememberSearch()}
              placeholder={t('dictionarySearch')}
              aria-label={t('dictionarySearchLabel')}
              aria-keyshortcuts='/'
              autoComplete='off'
              autoCapitalize='off'
              spellCheck='false'
            />
            {query ? (
              <button type='button' className='dictionary-search-clear' onClick={() => changeSearch({ query: '' })} aria-label={t('dictionaryClear')}>
                <Icon name='x' />
              </button>
            ) : (
              <kbd className='dictionary-search-key' aria-hidden='true'>/</kbd>
            )}
          </div>
          <div className='dictionary-toolbar'>
            <div className='segmented-control dictionary-filter' role='radiogroup' aria-label={t('dictionaryFilter')}>
              {TYPES.map(option => (
                <button
                  key={option.value}
                  type='button'
                  role='radio'
                  aria-checked={type === option.value}
                  className={'segmented-option' + (type === option.value ? ' active' : '')}
                  onClick={() => changeSearch({ type: option.value })}
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
            <div className='dictionary-subfilters'>
              {type === 'kanji' && (
                <select
                  value={level}
                  // A category of another level would show nothing: back to all of them
                  onChange={(event) => changeSearch({
                    level: event.target.value,
                    ...(getKanjiCategories(event.target.value).some(item => item.title === category) ? {} : { category: 'all' }),
                  })}
                  aria-label={t('dictionaryLevel')}
                >
                  {LEVELS.map(value => (
                    <option key={value} value={value}>{value === 'all' ? t('dictionaryLevelAll') : `JLPT ${value}`}</option>
                  ))}
                </select>
              )}
              {type === 'kanji' && (
                <select value={category} onChange={(event) => changeSearch({ category: event.target.value })} aria-label={t('dictionaryCategory')}>
                  <option value='all'>{t('dictionaryCategoryAll')}</option>
                  {(level === 'all' ? LEVELS.slice(1) : [level]).map(value => (
                    <optgroup key={value} label={`JLPT ${value}`}>
                      {getKanjiCategories(value).map(item => (
                        <option key={item.title} value={item.title}>{categoryLabel(item)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
              {type === 'word' && (
                <select value={topic} onChange={(event) => changeSearch({ topic: event.target.value })} aria-label={t('wordTopicLabel')}>
                  <option value='all'>{t('dictionaryTopicAll')}</option>
                  {getWordTopics().map(tag => (
                    <option key={tag} value={tag}>{tag === 'it' ? t('wordTopicIt') : topicLabel(tag)}</option>
                  ))}
                </select>
              )}
              <label className={'dictionary-weak-toggle' + (weakOnly ? ' active' : '')}>
                <input type='checkbox' checked={weakOnly} onChange={(event) => changeSearch({ weakOnly: event.target.checked })} />
                <Icon name={weakOnly ? 'check' : 'target'} />
                {t('dictionaryWeakOnly')}
              </label>
            </div>
          </div>
        </div>
        {!showHome && (
          <div className='dictionary-results-bar'>
            <span className='dictionary-count' aria-live='polite'>{t('dictionaryCount', { count: results.length })}</span>
            {/* Only for a search or a filter: the first 50 of everything is not a useful practice */}
            {filtered && results.length > 0 && (
              <button type='button' className='dictionary-practice' onClick={() => practice(practiced)}>
                <Icon name='target' />
                {t('dictionaryPracticeResults', { count: practiced.length })}
              </button>
            )}
          </div>
        )}
        {content}
        {!showHome && !showKanaTables && !grouped && more > 0 && (
          <button type='button' className='dictionary-more' onClick={() => setShown(count => count + PAGE_SIZE)}>
            {t('dictionaryShowMore', { count: more })}
          </button>
        )}
      </main>
      {detail && (
        <DictionaryDetail
          entry={detail}
          mastery={masteryOf(detail)}
          srsStage={srsStageOf(detail)}
          onOpen={setDetail}
          onPractice={practice}
          onClose={closeDetail}
        />
      )}
    </>
  );
}
