import React, { useState, useEffect, useMemo } from 'react';
import { kanaCharacters } from '../kanaCharacters.js';
import { useLanguage } from '../i18n';
import { getKanjiSrsProgress, getKanjiSrsStage, getSelectedKanjiGroupTitles } from '../kanjiSrs.js';
import { calculateMastery, EXPERIENCE_ANSWERS, getMasteryBreakdown, getWeakestItems } from '../mastery.js';
import { getConfusionPairs, readConfusions } from '../confusions.js';
import { getListForPractice, getStoredPracticeMode } from '../practiceList.js';
import ProgressActivity from './ProgressActivity.js';
import KanjiSrsPanel from './KanjiSrsPanel.js';
import Icon from './Icon.js';
import { PROGRESS_SECTIONS } from '../progressNavigation.js';
import { readUserStats } from '../storage.js';

const HIGHLIGHT_MS = 2800;

const SRS_STAGE_LABEL_KEYS = {
    learning: 'srsStageLearning',
    young: 'srsStageYoung',
    mature: 'srsStageMature',
};

function ProgressStatsModal(props) {
    const { t, meaningOf, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('characters');
    // The sentences are a download of their own (most of the app's data, see
    // sentences.js): loaded when their tab is opened, not with the menu
    const [sentenceData, setSentenceData] = useState(null);
    useEffect(() => {
        if (!props.visible || activeTab !== 'sentences' || sentenceData) return;
        let cancelled = false;
        import('../sentences.js').then(module => {
            if (!cancelled) setSentenceData({ sentences: module.sentences, getReadableSentences: module.getReadableSentences });
        });
        return () => { cancelled = true; };
    }, [props.visible, activeTab, sentenceData]);
    const [userStats, setUserStats] = useState({});
    const [confusions, setConfusions] = useState({});
    const [hoveredItem, setHoveredItem] = useState(null);

    useEffect(() => {
        // Load user stats from localStorage
        const stats = readUserStats();
        setUserStats(stats);
        setConfusions(readConfusions());
    }, [props.visible]);

    // Opened from a notification: go to the tab of that section, bring it into view and
    // highlight it for a moment, so the user sees where the feature lives
    useEffect(() => {
        if (!props.visible || !props.focusSection) return undefined;
        const tab = PROGRESS_SECTIONS[props.focusSection];
        if (tab) setActiveTab(tab);

        let section = null;
        const timers = [];
        timers.push(window.setTimeout(() => {
            section = document.querySelector(`.progress-stats-modal [data-progress-section='${props.focusSection}']`);
            if (!section) return;
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            section.classList.add('progress-section-highlight');
            timers.push(window.setTimeout(() => section.classList.remove('progress-section-highlight'), HIGHLIGHT_MS));
        }, 150));
        return () => {
            timers.forEach(timer => window.clearTimeout(timer));
            section?.classList.remove('progress-section-highlight');
        };
    }, [props.visible, props.focusSection]);

    useEffect(() => {
        // Clear hovered item when switching tabs
        setHoveredItem(null);
    }, [activeTab]);

    useEffect(() => {
        // Prevent background scrolling when modal is open
        if (props.visible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore scrolling when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [props.visible]);

    // Mastery of every practiced item, calculated once each time the stats are loaded
    const masteryByCharacter = useMemo(() => {
        const now = Date.now();
        const result = {};
        for (const character of Object.keys(userStats)) {
            result[character] = calculateMastery(userStats[character], character, now);
        }
        return result;
    }, [userStats]);

    const getMastery = (character) => masteryByCharacter[character] ?? null;

    // What a game would show now: the selected groups and practice type
    const practiceList = useMemo(
        () => props.visible ? getListForPractice(getSelectedKanjiGroupTitles(), getStoredPracticeMode()) : [],
        [props.visible]
    );

    const weakestItems = useMemo(() => {
        return getWeakestItems(practiceList, userStats).map(item => ({
            character: item.jp_character,
            romanji: item.romanji[0],
            meaning: item.meaning ? meaningOf(item.jp_character, item.meaning) : undefined,
            mastery: item.mastery,
        }));
        // meaningOf changes on every render, the language it depends on does not
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [practiceList, userStats, language]);

    // Most frequent mix-ups (practiced from every kana, not only the selection)
    const confusionPairs = useMemo(() => getConfusionPairs(confusions), [confusions]);

    // Get color based on mastery level
    const getMasteryColor = (mastery) => {
        if (mastery === null) return '#ffffff10'; // No data - very subtle
        if (mastery >= 80) return '#4ade80'; // Green - excellent
        if (mastery >= 60) return '#22d3ee'; // Cyan - good
        if (mastery >= 40) return '#fbbf24'; // Yellow - ok
        if (mastery >= 20) return '#fb923c'; // Orange - needs work
        return '#f87171'; // Red - struggling
    };

    // Get mastery bracket for sorting
    const getMasteryBracket = (mastery) => {
        if (mastery === null) return 0; // No data
        if (mastery >= 80) return 5; // Excellent
        if (mastery >= 60) return 4; // Good
        if (mastery >= 40) return 3; // OK
        if (mastery >= 20) return 2; // Needs Work
        return 1; // Struggling
    };

    // Get all characters from kanaCharacters
    const getAllCharacters = () => {
        const characters = [];
        let index = 0;

        ['hiragana', 'katakana'].forEach(type => {
            Object.keys(kanaCharacters[type]).forEach(groupKey => {
                const group = kanaCharacters[type][groupKey];
                Object.keys(group.characters).forEach(charKey => {
                    const char = group.characters[charKey];
                    characters.push({
                        character: char.jp_character,
                        romanji: char.romanji[0],
                        type: type,
                        originalIndex: index++
                    });
                });
            });
        });

        // Sort: characters with data first (by mastery bracket), then characters without data
        // Within same bracket, sort by original order
        return characters.sort((a, b) => {
            const masteryA = getMastery(a.character);
            const masteryB = getMastery(b.character);

            const bracketA = getMasteryBracket(masteryA);
            const bracketB = getMasteryBracket(masteryB);

            if (bracketA !== bracketB) {
                return bracketB - bracketA; // Higher bracket first
            }

            return a.originalIndex - b.originalIndex; // Original order
        });
    };

    const getAllKanji = () => {
        const kanji = [];
        let index = 0;

        Object.values(kanaCharacters.kanji).forEach(group => {
            Object.values(group.characters).forEach(character => {
                kanji.push({
                    character: character.jp_character,
                    romanji: character.romanji[0],
                    meaning: meaningOf(character.jp_character, character.meaning),
                    originalIndex: index++
                });
            });
        });

        return kanji.sort((a, b) => {
            const masteryA = getMastery(a.character);
            const masteryB = getMastery(b.character);
            const bracketDifference = getMasteryBracket(masteryB) - getMasteryBracket(masteryA);
            return bracketDifference || a.originalIndex - b.originalIndex;
        });
    };

    // The sentences the user has practiced: all 1,400+ would be too much to
    // show, and the ones never answered have no progress to display anyway.
    // In the summary they still count against the sentences that can be read
    // with the selected groups, like the other tabs count against everything
    const getAllSentences = () => {
        if (!sentenceData) return [];
        const practiced = sentenceData.sentences
            .map((sentence, index) => ({
                character: sentence.jp_character,
                romanji: sentence.romanji[0],
                meaning: meaningOf(sentence.jp_character, sentence.meaning),
                originalIndex: index,
            }))
            .filter(item => getMastery(item.character) !== null);

        // Same order as the other tabs: by mastery bracket, then the original order
        return practiced.sort((a, b) => {
            const bracketDifference = getMasteryBracket(getMastery(b.character)) - getMasteryBracket(getMastery(a.character));
            return bracketDifference || a.originalIndex - b.originalIndex;
        });
    };

    // Get all words from kanaCharacters
    const getAllWords = () => {
        const words = Object.values(kanaCharacters.words).map((word, index) => ({
            character: word.jp_character,
            romanji: word.romanji[0],
            meaning: meaningOf(word.jp_character, word.meaning),
            originalIndex: index
        }));

        // Same order as the other tabs: by mastery bracket, then the original order
        return words.sort((a, b) => {
            const bracketDifference = getMasteryBracket(getMastery(b.character)) - getMasteryBracket(getMastery(a.character));
            return bracketDifference || a.originalIndex - b.originalIndex;
        });
    };

    // Format stats for tooltip
    const getStatsText = (character) => {
        const stats = userStats[character];
        if (!stats) {
            return t('statsNoPracticeData');
        }

        const totalAttempts = stats.totalRightGuesses + stats.totalWrongGuesses;
        const accuracy = totalAttempts > 0 ? Math.round((stats.totalRightGuesses / totalAttempts) * 100) : 0;
        const avgResponseTime = stats.totalRightGuesses > 0
            ? (stats.totaltotalResponseTime / stats.totalRightGuesses / 1000).toFixed(2)
            : 0;
        const avgEditsPerCorrect = stats.totalRightGuesses > 0
            ? ((stats.totalEditCount || 0) / stats.totalRightGuesses).toFixed(1)
            : 0;

        let statsLines = [
            t('statsTimesShown', { count: stats.totalTimesShown || 'N/A' }),
            t('statsCorrectWrong', { correct: stats.totalRightGuesses, wrong: stats.totalWrongGuesses }),
            t('statsAccuracy', { percent: accuracy }),
            t('statsAvgTime', { seconds: avgResponseTime }),
        ];

        if (stats.totalEditCount > 0) {
            statsLines.push(t('statsEdits', { count: stats.totalEditCount, average: avgEditsPerCorrect }));
        }

        if (stats.totalWrongSubmissions > 0) {
            statsLines.push(t('statsWrongSubmissions', { count: stats.totalWrongSubmissions }));
        }

        if (stats.totalAskForHelpCounter > 0) {
            statsLines.push(t('statsHelpRequested', { count: stats.totalAskForHelpCounter }));
        }

        if (activeTab === 'kanji') {
            const srsEntry = getKanjiSrsProgress()[character];
            const stage = getKanjiSrsStage(srsEntry);
            if (stage !== 'new') {
                const dueAt = Number(srsEntry.dueAt);
                const next = dueAt <= Date.now()
                    ? t('srsForecastNow')
                    : new Date(dueAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
                statsLines.push(t('srsTooltip', { stage: t(SRS_STAGE_LABEL_KEYS[stage]), next }));
            }
        }

        return statsLines.join('\n');
    };

    // Render character grid item
    const renderGridItem = (item, index) => {
        const mastery = getMastery(item.character);
        const color = getMasteryColor(mastery);

        return (
            <div
                key={`${activeTab}-${item.character}-${item.romanji}-${index}`}
                className="progress-stats-grid-item"
                style={{ 
                    backgroundColor: color,
                    '--mastery-color': color
                }}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                // Touch screens have no mouseleave: a tap shows the tooltip and a tap elsewhere hides it
                onClick={(e) => {
                    e.stopPropagation();
                    setHoveredItem(item);
                }}
            >
                <div className={`progress-stats-grid-item-character${activeTab === 'kanji' ? ' progress-stats-kanji-character' : ''}${activeTab === 'sentences' ? ' progress-stats-sentence-character' : ''}`}>
                    {item.character}
                </div>
                <div className="progress-stats-grid-item-romanji">
                    {item.romanji}
                </div>
                {mastery !== null && (
                    <div className="progress-stats-grid-item-mastery">
                        {mastery}%
                    </div>
                )}
            </div>
        );
    };

    // Mastery of the hovered item and what lowers it, biggest first: the
    // percentage on the tile is mastery, not accuracy, so a kana answered
    // right every time can still be under 100%
    const renderMastery = (character) => {
        const breakdown = getMasteryBreakdown(userStats[character], character);
        if (!breakdown) return null;
        const reasons = [
            ...breakdown.parts.map(part => ({ key: part.key, lost: part.lost })),
            { key: 'retention', lost: breakdown.retentionLost },
        ]
            .filter(reason => reason.lost >= 0.5)
            .sort((a, b) => b.lost - a.lost);
        const reasonText = (key) => {
            switch (key) {
                case 'experience':
                    return t('masteryLossExperience', { count: breakdown.lifetimeAttempts, needed: EXPERIENCE_ANSWERS });
                case 'speed':
                    return t('masteryLossSpeed', {
                        seconds: breakdown.averageSeconds === null ? '—' : breakdown.averageSeconds.toFixed(2),
                    });
                case 'retention':
                    return t('masteryLossRetention', { days: Math.floor(breakdown.daysSincePractice) });
                default:
                    return t({
                        accuracy: 'masteryLossAccuracy',
                        help: 'masteryLossHelp',
                        edits: 'masteryLossEdits',
                        submissions: 'masteryLossSubmissions',
                    }[key]);
            }
        };
        return (
            <div className="progress-stats-tooltip-mastery">
                <div className="progress-stats-tooltip-mastery-value">
                    <span className="progress-stats-tooltip-mastery-dot" style={{ background: getMasteryColor(breakdown.mastery) }} />
                    {t('masteryValue', { percent: breakdown.mastery })}
                </div>
                {reasons.length > 0 && (
                    <>
                        <div className="progress-stats-tooltip-mastery-label">{t('masteryLossTitle')}</div>
                        <ul className="progress-stats-tooltip-mastery-reasons">
                            {reasons.map(reason => (
                                <li key={reason.key}>
                                    <span>{reasonText(reason.key)}</span>
                                    <span className="progress-stats-tooltip-mastery-points">−{Math.round(reason.lost)}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        );
    };

    // Render tooltip
    const renderTooltip = () => {
        if (!hoveredItem) return null;

        return (
            <div className="progress-stats-tooltip">
                <div className={`progress-stats-tooltip-title${activeTab === 'sentences' ? ' progress-stats-tooltip-title-sentence' : ''}`}>
                    {hoveredItem.character}
                    {hoveredItem.romanji && ` (${hoveredItem.romanji})`}
                    {hoveredItem.meaning && <span className="progress-stats-tooltip-meaning"> - {hoveredItem.meaning}</span>}
                </div>
                {renderMastery(hoveredItem.character)}
                <div className="progress-stats-tooltip-content">
                    {getStatsText(hoveredItem.character).split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>
            </div>
        );
    };

    // Get summary stats
    const getSummaryStats = (items) => {
        const withData = items.filter(item => getMastery(item.character) !== null);

        const masterySum = withData.reduce((sum, item) => sum + getMastery(item.character), 0);
        const avgMastery = withData.length > 0 ? Math.round(masterySum / withData.length) : 0;
        // Over everything in the tab: an item never practiced counts as 0%
        const overallProgress = items.length > 0 ? Math.round(masterySum / items.length) : 0;

        return {
            total: items.length,
            practiced: withData.length,
            avgMastery: avgMastery,
            overallProgress: overallProgress
        };
    };

    if (!props.visible) {
        return null;
    }

    const items = activeTab === 'characters' ? getAllCharacters()
        : activeTab === 'kanji' ? getAllKanji()
        : activeTab === 'words' ? getAllWords()
        : activeTab === 'sentences' ? getAllSentences() : [];

    // The sentences tab only shows the practiced sentences, but the summary
    // counts them against the ones that can be read with the selected groups,
    // like the other tabs count against everything in the tab
    let summary;
    if (activeTab === 'sentences') {
        const readableTotal = sentenceData ? sentenceData.getReadableSentences(getSelectedKanjiGroupTitles()).length : 0;
        const masterySum = items.reduce((sum, item) => sum + getMastery(item.character), 0);
        summary = {
            total: readableTotal,
            practiced: items.length,
            avgMastery: items.length > 0 ? Math.round(masterySum / items.length) : 0,
            // An unpracticed sentence counts as 0%, so overall progress stays
            // below the average mastery of the practiced ones
            overallProgress: readableTotal > 0 ? Math.min(100, Math.round(masterySum / readableTotal)) : 0,
        };
    } else {
        summary = getSummaryStats(items);
    }

    return (
        <div className='progress-stats-modal-background' onClick={props.onClose}>
            <div className='progress-stats-modal' onClick={(e) => { e.stopPropagation(); setHoveredItem(null); }}>
                <div className='progress-stats-modal-header'>
                    <h2>{t('statsTitle')}</h2>
                    <button className='progress-stats-modal-close' onClick={props.onClose} aria-label={t('statsClose')}><Icon name='x' strokeWidth={2.5} /></button>
                </div>

                <div className='progress-stats-weakest' data-progress-section='weakest'>
                    <div className='progress-stats-weakest-header'>
                        <span>{t('statsWeakestTitle')}</span>
                        {weakestItems.length > 0 && (
                            <button
                                className='progress-stats-weakest-button'
                                onClick={() => props.onPracticeWeakest(weakestItems.map(item => item.character))}
                            >
                                {t('statsPracticeWeakest')}
                            </button>
                        )}
                    </div>
                    {weakestItems.length > 0 ? (
                        <div className='progress-stats-weakest-list'>
                            {weakestItems.map(item => (
                                <div
                                    key={item.character}
                                    className='progress-stats-weakest-item'
                                    style={{ backgroundColor: getMasteryColor(item.mastery) }}
                                    onMouseEnter={() => setHoveredItem(item)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHoveredItem(item);
                                    }}
                                >
                                    <span className='progress-stats-weakest-character'>{item.character}</span>
                                    <span className='progress-stats-weakest-mastery'>{item.mastery}%</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className='progress-stats-weakest-empty'>{t('statsWeakestEmpty')}</p>
                    )}
                </div>

                <div className='progress-stats-modal-tabs segmented-control' role='tablist'>
                    <button
                        role='tab'
                        aria-selected={activeTab === 'characters'}
                        className={`progress-stats-tab segmented-option${activeTab === 'characters' ? ' active' : ''}`}
                        onClick={() => setActiveTab('characters')}
                    >
                        <Icon name='type' className='segmented-option-icon' />
                        <span>{t('practiceCharacters')}</span>
                    </button>
                    <button
                        role='tab'
                        aria-selected={activeTab === 'words'}
                        className={`progress-stats-tab segmented-option${activeTab === 'words' ? ' active' : ''}`}
                        onClick={() => setActiveTab('words')}
                    >
                        <Icon name='book-open' className='segmented-option-icon' />
                        <span>{t('practiceWords')}</span>
                    </button>
                    <button
                        role='tab'
                        aria-selected={activeTab === 'kanji'}
                        className={`progress-stats-tab segmented-option${activeTab === 'kanji' ? ' active' : ''}`}
                        onClick={() => setActiveTab('kanji')}
                    >
                        <Icon name='languages' className='segmented-option-icon' />
                        <span>{t('practiceKanji')}</span>
                    </button>
                    <button
                        role='tab'
                        aria-selected={activeTab === 'sentences'}
                        className={`progress-stats-tab segmented-option${activeTab === 'sentences' ? ' active' : ''}`}
                        onClick={() => setActiveTab('sentences')}
                    >
                        <Icon name='message-square' className='segmented-option-icon' />
                        <span>{t('practiceLong')}</span>
                    </button>
                    <button
                        role='tab'
                        aria-selected={activeTab === 'activity'}
                        className={`progress-stats-tab segmented-option${activeTab === 'activity' ? ' active' : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        <Icon name='bar-chart' className='segmented-option-icon' />
                        <span>{t('statsTabActivity')}</span>
                    </button>
                </div>

                {activeTab === 'activity' ? (
                    <div className='progress-activity-scroll'>
                        <ProgressActivity
                            userStats={userStats}
                            confusionPairs={confusionPairs}
                            onPracticeMixups={props.onPracticeMixups}
                            language={language}
                            t={t}
                        />
                    </div>
                ) : (
                    <>
                        <div className='progress-stats-summary'>
                            <div className='progress-stats-summary-item'>
                                <div className='progress-stats-summary-value'>{summary.practiced}/{summary.total}</div>
                                <div className='progress-stats-summary-label'>{t('statsPracticed')}</div>
                            </div>
                            <div className='progress-stats-summary-item'>
                                <div className='progress-stats-summary-value'>{summary.avgMastery}%</div>
                                <div className='progress-stats-summary-label'>{t('statsAvgMastery')}</div>
                            </div>
                            <div className='progress-stats-summary-item'>
                                <div className='progress-stats-summary-value'>{summary.overallProgress}%</div>
                                <div className='progress-stats-summary-label'>{t('statsOverallProgress')}</div>
                            </div>
                        </div>

                        {activeTab === 'kanji' && <KanjiSrsPanel visible={props.visible} language={language} t={t} />}

                        <div className='progress-stats-legend'>
                            <div className='progress-stats-legend-item'>
                                <div className='progress-stats-legend-color' style={{backgroundColor: '#4ade80'}}></div>
                                <span>{t('statsExcellent')}</span>
                            </div>
                            <div className='progress-stats-legend-item'>
                                <div className='progress-stats-legend-color' style={{backgroundColor: '#22d3ee'}}></div>
                                <span>{t('statsGood')}</span>
                            </div>
                            <div className='progress-stats-legend-item'>
                                <div className='progress-stats-legend-color' style={{backgroundColor: '#fbbf24'}}></div>
                                <span>{t('statsOk')}</span>
                            </div>
                            <div className='progress-stats-legend-item'>
                                <div className='progress-stats-legend-color' style={{backgroundColor: '#fb923c'}}></div>
                                <span>{t('statsNeedsWork')}</span>
                            </div>
                            <div className='progress-stats-legend-item'>
                                <div className='progress-stats-legend-color' style={{backgroundColor: '#f87171'}}></div>
                                <span>{t('statsStruggling')}</span>
                            </div>
                            <div className='progress-stats-legend-item'>
                                <div className='progress-stats-legend-color' style={{backgroundColor: '#ffffff10'}}></div>
                                <span>{t('statsNoData')}</span>
                            </div>
                        </div>

                        <div className={`progress-stats-grid-container${activeTab === 'sentences' ? ' progress-stats-sentence-grid-container' : ''}`}>
                            {activeTab === 'sentences' && !sentenceData ? (
                                <p className='progress-stats-sentences-empty' role='status'>{t('pageLoading')}</p>
                            ) : activeTab === 'sentences' && items.length === 0 ? (
                                <p className='progress-stats-sentences-empty'>{t('statsSentencesEmpty')}</p>
                            ) : (
                                <div className='progress-stats-grid' key={activeTab}>
                                    {items.map((item, index) => renderGridItem(item, index))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {renderTooltip()}
            </div>
        </div>
    );
}

export default ProgressStatsModal;
