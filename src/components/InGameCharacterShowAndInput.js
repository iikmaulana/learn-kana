import React from 'react'
import {  useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import { kanaCharacters } from '../kanaCharacters.js'
import { getReadableSentences } from '../sentences.js'
import { kanjiReadings } from '../kanjiReadings.js'
import { getSelectedKanjiGroupTitles, getSrsKanjiCharacters, recordKanjiSrsAnswer } from '../kanjiSrs.js'
import UserGameScoreWindow from './UserGameScoreWindow.js'
import { useLanguage } from '../i18n'

let fontClassList = [
  // "Belanosima",
  "KleeOne",
  "Kaisei_Tokumin",
  "Noto_Serif_JP",
  "Shippori_Mincho",
  "Tsukimi_Rounded",
  "YokoMoji",
  "LeftHanded",
  // "JiyunoTsubasa",
  // "KleeOne",
  "YujiBoku",
]

/* userStats object structure:
{
    "あ": {
        "totalTimesShown": 10, // New: Total times this character has been shown
        "totalRightGuesses": 6,
        "totalWrongGuesses": 1, // Changed from totalTouchWrongGuesses
        "totalWrongSubmissions": 2, // New: Total wrong complete submissions (keyboard mode)
        "totalEditCount": 15, // New: Total backspace/delete key presses
        "totaltotalResponseTime": 2.36, // Sum of response times for correct guesses
        "totalAskForHelpCounter": 3,
        "currentGameStats": { // Stats for the current session/game
          "rightGuesses":1,
          "wrongGuesses":0, // Changed from touchWrongGuesses
          "wrongSubmissions":0, // New: Wrong complete submissions this session
          "editCount":3, // New: Backspace/delete presses this session
          "totalResponseTime":1.33,
          "askForHelpCounter":0
        },
        "dailyPerformance": [ // New: Array to store daily performance metrics
            {
                "date": 1678886400000, // Timestamp for the day (e.g., midnight UTC)
                "rightGuesses": 3,
                "wrongGuesses": 1,
                "wrongSubmissions": 2, // New: Wrong complete submissions this day
                "editCount": 8, // New: Backspace/delete presses this day
                "askForHelpCounter": 1,
                "responseTimeSum": 1.45 // Sum of response times for correct guesses this day
            }

            // ... more entries for other days
        ],
        "last7DaysStats": [ // Potentially deprecated or to be phased out in favor of dailyPerformance
            {
                "date": 12379898722,
                "rightGuesses": 3,
                "wrongGuesses": 1, // Changed from TouchwrongGuesses
                "totalResponseTime": 1.45,
                "askForHelpCounter": 1
            }
        ]
    }
}
*/
if (localStorage.getItem('userStats') === null) {
  localStorage.setItem('userStats', "{}")
}

// This timer is set to current time when a new kana is showned. 
// We use it to calculate how long it takes the user to respond.
let kanaTimeToAnswerTimer = 0;
let inGameKanaOnScreen = "";

function normalizeAnswer(answer) {
  return String(answer ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\s-]/g, '');
}

async function selectNextCharacter(charactersToShow) {
  let userStats = JSON.parse(localStorage.getItem('userStats')) || {};
  let weightedCharacters = [];
  const baseWeight = 50;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();

  // First pass: collect performance metrics for all characters
  let characterMetrics = [];

  for (const character of charactersToShow) {
    const stats = userStats[character.jp_character];
    let errorRate = 0;
    let avgResponseTime = 0;
    let avgEditCount = 0;
    let wrongSubmissionRate = 0;
    let hasData = false;

    if (stats && stats.dailyPerformance && stats.dailyPerformance.length > 0) {
      let recentRightGuesses = 0;
      let recentWrongGuesses = 0;
      let recentAskForHelpCounter = 0;
      let recentResponseTimeSum = 0;
      let recentEditCount = 0;
      let recentWrongSubmissions = 0;

      stats.dailyPerformance.forEach(daily => {
        if (daily.date >= thirtyDaysAgoTimestamp) {
          recentRightGuesses += daily.rightGuesses || 0;
          recentWrongGuesses += daily.wrongGuesses || 0;
          recentAskForHelpCounter += daily.askForHelpCounter || 0;
          recentResponseTimeSum += daily.responseTimeSum || 0;
          recentEditCount += daily.editCount || 0;
          recentWrongSubmissions += daily.wrongSubmissions || 0;
        }
      });

      const totalAttempts = recentRightGuesses + recentWrongGuesses + recentAskForHelpCounter;

      if (totalAttempts > 0) {
        errorRate = (recentWrongGuesses + recentAskForHelpCounter) / totalAttempts;
        avgResponseTime = recentRightGuesses > 0 ? recentResponseTimeSum / recentRightGuesses : 0;
        avgEditCount = recentRightGuesses > 0 ? recentEditCount / recentRightGuesses : 0;
        wrongSubmissionRate = totalAttempts > 0 ? recentWrongSubmissions / totalAttempts : 0;
        hasData = true;
      }
    }

    characterMetrics.push({
      character,
      errorRate,
      avgResponseTime,
      avgEditCount,
      wrongSubmissionRate,
      hasData
    });
  }

  // Calculate median values for characters with data
  const charsWithData = characterMetrics.filter(m => m.hasData);

  let medianErrorRate = 0;
  let medianResponseTime = 0;
  let medianEditCount = 0;
  let medianWrongSubmissionRate = 0;

  if (charsWithData.length > 0) {
    const sortedByError = [...charsWithData].sort((a, b) => a.errorRate - b.errorRate);
    const sortedByTime = [...charsWithData].sort((a, b) => a.avgResponseTime - b.avgResponseTime);
    const sortedByEdits = [...charsWithData].sort((a, b) => a.avgEditCount - b.avgEditCount);
    const sortedByWrongSub = [...charsWithData].sort((a, b) => a.wrongSubmissionRate - b.wrongSubmissionRate);

    const midPoint = Math.floor(sortedByError.length / 2);
    medianErrorRate = sortedByError.length % 2 === 0
      ? (sortedByError[midPoint - 1].errorRate + sortedByError[midPoint].errorRate) / 2
      : sortedByError[midPoint].errorRate;

    medianResponseTime = sortedByTime.length % 2 === 0
      ? (sortedByTime[midPoint - 1].avgResponseTime + sortedByTime[midPoint].avgResponseTime) / 2
      : sortedByTime[midPoint].avgResponseTime;

    medianEditCount = sortedByEdits.length % 2 === 0
      ? (sortedByEdits[midPoint - 1].avgEditCount + sortedByEdits[midPoint].avgEditCount) / 2
      : sortedByEdits[midPoint].avgEditCount;

    medianWrongSubmissionRate = sortedByWrongSub.length % 2 === 0
      ? (sortedByWrongSub[midPoint - 1].wrongSubmissionRate + sortedByWrongSub[midPoint].wrongSubmissionRate) / 2
      : sortedByWrongSub[midPoint].wrongSubmissionRate;
  }

  // Second pass: assign weights based on comparison to median
  for (const metric of characterMetrics) {
    let weight = baseWeight;

    if (metric.hasData) {
      // Calculate how much worse than median this character is
      const errorDiff = metric.errorRate - medianErrorRate;
      const timeDiff = metric.avgResponseTime - medianResponseTime;
      const editDiff = metric.avgEditCount - medianEditCount;
      const wrongSubDiff = metric.wrongSubmissionRate - medianWrongSubmissionRate;

      // Characters worse than median get more weight
      if (errorDiff > 0) {
        // Error rate above median: increase weight significantly
        weight += errorDiff * 150;
      }

      if (timeDiff > 0 && medianResponseTime > 0) {
        // Response time above median: increase weight
        weight += (timeDiff / 1000) * 20;
      }

      if (editDiff > 0) {
        // More edits than median indicates uncertainty
        weight += editDiff * 10;
      }

      if (wrongSubDiff > 0) {
        // More wrong submissions than median indicates confusion
        weight += wrongSubDiff * 120;
      }

      // Characters better than median get reduced weight
      if (errorDiff < 0) {
        weight += errorDiff * 100; // Reduces weight for low error rates
      }

      if (timeDiff < 0 && medianResponseTime > 0) {
        weight += (timeDiff / 1000) * 10; // Reduces weight for fast responses
      }

      if (editDiff < 0) {
        weight += editDiff * 5; // Slight reduction for low edits
      }

      if (wrongSubDiff < 0) {
        weight += wrongSubDiff * 60; // Reduction for low wrong submissions
      }

    } else {
      // No data: give slightly higher weight to encourage learning new characters
      weight = baseWeight * 1.3;
    }

    weight = Math.max(5, weight); // Ensure minimum weight
    weightedCharacters.push({ ...metric.character, weight });
  }

  // Weighted random selection
  let totalWeight = weightedCharacters.reduce((sum, char) => sum + char.weight, 0);

  // Handle cases where all weights are zero (e.g., initial state or after filtering)
  // In such a scenario, pick a character completely at random.
  if (totalWeight === 0) {
    const randomIndex = Math.floor(Math.random() * charactersToShow.length);
    return charactersToShow[randomIndex];
  }

  let randomNum = Math.random() * totalWeight;
  let accumulatedWeight = 0;

  for (const char of weightedCharacters) {
    accumulatedWeight += char.weight;
    if (randomNum <= accumulatedWeight) {
      return char;
    }
  }

  // Fallback in case something goes wrong (should ideally not be reached)
  return charactersToShow[Math.floor(Math.random() * charactersToShow.length)];
}

export default function InGameCharacterShowAndInput() {
  const { t, meaningOf } = useLanguage();
  const isMacOS = /Mac/i.test(navigator.userAgentData?.platform || navigator.platform);

  /* 
    ##########################################
    # Creates and handles the Kana character #
    ##########################################
  */
  const [onScreenKana, setKana] = useState('');
  const [srsCardRevealed, setSrsCardRevealed] = useState(false);
  const [srsCardDragOffset, setSrsCardDragOffset] = useState(0);
  const [srsCardSwipeDirection, setSrsCardSwipeDirection] = useState(null);
  const [onScreenCharacterType, setOnScreenCharacterType] = useState(null);
  // Character indices of the particles in the shown sentence, so they can be highlighted
  const [onScreenParticles, setOnScreenParticles] = useState([]);
  const [onScreenKanjiUsage, setOnScreenKanjiUsage] = useState(null);
  const [isKanjiUsageQuestion, setIsKanjiUsageQuestion] = useState(false);
  const [onScreenSolution, setSolution] = useState('');
  const [onScreenWordMeaning, setWordMeaning] = useState('');
  const [onScreenScore, setScore] = useState(0);
  const [userGameScoreWindowVisible, setUserGameScoreWindowVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  // Correct answers in a row, resets on a wrong answer or when asking for help
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  // Read by the keyboard handlers (registered once on mount) to ignore input behind the summary window
  const scoreWindowVisibleRef = useRef(false);
  const hasStartedInitialCharacterRef = useRef(false);
  const currentCharacterTypeRef = useRef(null);
  const waitingForKanjiNextRef = useRef(false);
  const kanjiAutoAdvanceTimeoutRef = useRef(null);
  const inGameAnswerListRef = useRef([]);
  const srsQueueRef = useRef(null);
  const srsFailedRef = useRef(false);
  const srsCurrentCardRef = useRef(null);
  const srsCardPointerStartRef = useRef(null);
  const srsCardDraggedRef = useRef(false);

  // Hints ("?" key / Hint button) can be turned off in the menu
  const hintsEnabled = localStorage.getItem("game-mode-hints") !== "false";

  // "Give me N Kanas" mode: N is the goal shown next to the score
  const gameModeSetting = JSON.parse(localStorage.getItem("gameMode"));
  const kanaGoal = (gameModeSetting && gameModeSetting.type === "kana-selector" && gameModeSetting.value !== -1)
    ? gameModeSetting.value
    : null;

  const characterGroupsToShow = useMemo(() => {
    const storedCharacterGroups = JSON.parse(localStorage.getItem("checkedKanas") || '[]');
    return Array.isArray(storedCharacterGroups) ? storedCharacterGroups : [];
  }, []);
  const practiceMode = localStorage.getItem('game-mode-practice') ||
    (localStorage.getItem("game-mode-word") === "true" ? "words" : "characters");
  const isSrsPractice = localStorage.getItem('game-mode-srs') === 'true';
  // SRS reviews are always answered by typing, whatever is picked in the menu
  const useTouchAnswers = !isSrsPractice && localStorage.getItem("game-mode-touch") === "true";
  const selectedKanjiGroups = useMemo(() => getSelectedKanjiGroupTitles(), []);
  const srsKanjiOverview = useMemo(
    () => isSrsPractice ? getSrsKanjiCharacters(selectedKanjiGroups) : null,
    [isSrsPractice, selectedKanjiGroups]
  );


  // Creates a list of all possible Kanas/Words to show, the element outputs look like this:
  // { "jp_character": "あ", "romanji": ["a"], "sound": "あ", "type": "kana/word", *"vocal": "a", *"meaning": "dog" }
  // *The key "vocal" only shows up when the type is "kana"
  // *The key "meaning" only shows up when the type is "word"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let charactersToShow = useMemo(
    () => isSrsPractice
      ? srsKanjiOverview.due
      : getListForPractice(characterGroupsToShow, practiceMode),
    [isSrsPractice, srsKanjiOverview, characterGroupsToShow, practiceMode]
  );
  if (isSrsPractice && srsQueueRef.current === null) {
    srsQueueRef.current = [...charactersToShow].sort(() => Math.random() - 0.5);
  }

  // Filter to problematic characters if that mode is active
  const problematicFilter = localStorage.getItem('problematicKanasFilter');
  let isProblematicsMode = false;
  if (problematicFilter && !isSrsPractice) {
    const problematicChars = JSON.parse(problematicFilter);
    charactersToShow = charactersToShow.filter(char => problematicChars.includes(char.jp_character));
    isProblematicsMode = true;

    // If filter resulted in no characters, clear it and use original list
    if (charactersToShow.length === 0) {
      localStorage.removeItem('problematicKanasFilter');
      isProblematicsMode = false;
      // Restore original list
      charactersToShow = isSrsPractice
        ? getSrsKanjiCharacters(getSelectedKanjiGroupTitles()).due
        : getListForPractice(characterGroupsToShow, practiceMode);
    }
  }

  // Be mad at the user if the charactersToShow is empty
  const navigate = useNavigate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (charactersToShow.length === 0 && !isSrsPractice) {
      navigate('/bruh', { state: { message: t('gameErrorNoKana') } });
    }
  }, [charactersToShow, isSrsPractice, navigate, t]);

  // game-mode-auto-next
  let autoNext = false;
  if (localStorage.getItem("game-mode-auto-next") === "true") {
    autoNext = true;
  }


  function getListOfKanas(charGroups) {
    let output = []
    const selectedGroups = Array.isArray(charGroups) ? charGroups : [];
    Object.entries(kanaCharacters).forEach(([categoryKey, category]) => {
      if (categoryKey === 'words') return;
      Object.entries(category).forEach(([groupKey, charGroup]) => {
        if (!charGroup || !charGroup.title || !selectedGroups.includes(charGroup.title)) return;
        Object.entries(charGroup.characters).forEach(([charKey, char]) => {
          if (!char || typeof char !== 'object') return;
          const normalizedChar = { ...char };
          if (categoryKey === 'kanji') {
            normalizedChar.type = 'kanji';
          } else {
            normalizedChar.vocal = normalizedChar.vocal || charKey;
            normalizedChar.type = 'kana';
          }
          output.push(normalizedChar);
        });
      });
    });
    return output;
  }

  function getListOfWords(charGroups) {
    let output = []
    const selectedGroups = Array.isArray(charGroups) ? charGroups : [];
    Object.entries(kanaCharacters.words).forEach(([key, value]) => {
      let ignoreWord = false;
      for (let i = 0; i < value.hiragana_groups.length; i++) {
        if (!selectedGroups.includes(value.hiragana_groups[i])) {
          ignoreWord = true;
        }
      }
      for (let i = 0; i < value.katakana_groups.length; i++) {
        if (!selectedGroups.includes(value.katakana_groups[i])) {
          ignoreWord = true;
        }
      }
      if (!ignoreWord) {
        output.push({
          "jp_character": value.jp_character,
          "romanji": value.romanji,
          "sound": value.sound,
          "meaning": value.meaning,
          "type": "word",
        })
      }
    })
    return output;
  }

  // Sentence practice: real beginner sentences, each one typed as a single
  // romaji answer. Only sentences the player can read with the selected
  // hiragana / katakana / kanji groups are shown, and the meaning is
  // revealed once the sentence is completed.
  function getListOfSentences(charGroups) {
    return getReadableSentences(charGroups).map(sentence => ({
      "jp_character": sentence.jp_character,
      "romanji": sentence.romanji,
      "particles": sentence.particles || [],
      "sound": "",
      "meaning": sentence.meaning,
      "type": "long",
    }));
  }

  function getListForPractice(charGroups, mode) {
    const characters = getListOfKanas(charGroups);
    if (mode === 'mixed') {
      return [...characters, ...getListOfWords(charGroups)];
    }
    if (mode === 'words') return getListOfWords(charGroups);
    if (mode === 'long') return getListOfSentences(charGroups);
    // "characters": every selected kana and kanji group
    return characters;
  }

  // Helper function to get n random unique elements from an array
  function sample(inputArray, numberOfOutputs, onePerVocal = false) {
    const vocals = ["a", "i", "u", "e", "o"];
    let current_vocal = 0;

    // Create a copy of the original array to avoid modifying it
    const copyArray = [...inputArray];
    const sampledElements = [];

    if (inputArray.length < numberOfOutputs) {
      inputArray = inputArray.concat(inputArray);
      onePerVocal = false;
    }

    const hasVocalHints = copyArray.some(item => item && item.vocal && vocals.includes(item.vocal));
    if (onePerVocal && !hasVocalHints) {
      onePerVocal = false;
    }

    // If n is greater than the size of a, set possible unique outputs to the size of array
    const numberOfUniqueOutputs = Math.min(numberOfOutputs, copyArray.length);

    for (let i = 0; i < numberOfUniqueOutputs; i++) {
      while (true) {
        const randomIndex = Math.floor(Math.random() * copyArray.length);
        if (onePerVocal) {
          const candidate = copyArray[randomIndex];
          if (candidate?.vocal && vocals.includes(candidate.vocal)) {
            if (candidate.vocal === vocals[current_vocal]) {
              current_vocal++;
            } else {
              continue;
            }
          } else {
            onePerVocal = false;
          }
        }
        sampledElements.push(copyArray[randomIndex]);
        // Remove the selected element from the copyArray to avoid duplicates
        copyArray.splice(randomIndex, 1);
        break;
      }
    }

    // If still space, fill it with duplicate elements
    const remainingOutputs = numberOfOutputs - numberOfUniqueOutputs;
    for (let i = 0; i < remainingOutputs; i++) {
      const randomIndex = Math.floor(Math.random() * numberOfUniqueOutputs);
      sampledElements.push(sampledElements[randomIndex]);
    }

    return sampledElements;
  }

  /* 
  ##########################################
  # Creates and handles the touch answers #
  ##########################################
  */
  function fillTouchAnswers(picked_kana) {
    const useVocalSampling = Boolean(picked_kana && picked_kana.vocal);
    const possibleAnswers = sample(charactersToShow, 5, useVocalSampling);
    const elements = document.querySelectorAll('.in-game-touch-answer>p');

    if (useVocalSampling) {
      for (let i = 0; i < possibleAnswers.length; i++) {
        if (possibleAnswers[i].vocal === picked_kana.vocal) {
          Object.assign(possibleAnswers[i], picked_kana);
        }
      }
    } else {
      const targetIndex = Math.floor(Math.random() * possibleAnswers.length);
      Object.assign(possibleAnswers[targetIndex], picked_kana);
    }

    // Go over the elements
    for (let i = 0; i < elements.length; i++) {
      const answer = Array.isArray(possibleAnswers[i]?.romanji) ? possibleAnswers[i].romanji : [possibleAnswers[i]?.romanji || ''];
      elements[i].textContent = answer[0];
    }
  }

  function resetCurentGameStats() {
    let currentUserStats = JSON.parse(localStorage.getItem('userStats'));
    for (const kana in currentUserStats) {
      if (currentUserStats[kana].currentGameStats === undefined) {
        currentUserStats[kana].currentGameStats = {}
      }
      currentUserStats[kana].currentGameStats.rightGuesses = 0;
      currentUserStats[kana].currentGameStats.wrongGuesses = 0;
      currentUserStats[kana].currentGameStats.wrongSubmissions = 0;
      currentUserStats[kana].currentGameStats.editCount = 0;
      currentUserStats[kana].currentGameStats.totalResponseTime = 0;
      currentUserStats[kana].currentGameStats.askForHelpCounter = 0;
    }
    localStorage.setItem('userStats', JSON.stringify(currentUserStats));
  }

  function updateCurrentGameStats(guessType) {
    if (guessType === "correct") {
      setStreak(prevStreak => prevStreak + 1);
    } else if (guessType === "wrong" || guessType === "askForHelp") {
      setStreak(0);
    }
    const currentTime = Date.now();
    let currentUserStats = JSON.parse(localStorage.getItem('userStats')) || {};
    const character = inGameKanaOnScreen;

    // Initialize stats for the character if it's new
    if (!currentUserStats[character]) {
      currentUserStats[character] = {
        totalTimesShown: 0,
        totalRightGuesses: 0,
        totalWrongGuesses: 0,
        totalWrongSubmissions: 0,
        totalEditCount: 0,
        totaltotalResponseTime: 0,
        totalAskForHelpCounter: 0,
        currentGameStats: { rightGuesses: 0, wrongGuesses: 0, wrongSubmissions: 0, editCount: 0, totalResponseTime: 0, askForHelpCounter: 0 },
        dailyPerformance: [],
        // last7DaysStats: [], // Retain if needed for other purposes, or phase out
      };
    } else {
      // Handle migration from totalTouchWrongGuesses to totalWrongGuesses
      if (currentUserStats[character].hasOwnProperty('totalTouchWrongGuesses')) {
        currentUserStats[character].totalWrongGuesses = currentUserStats[character].totalTouchWrongGuesses;
        delete currentUserStats[character].totalTouchWrongGuesses;
      }
      if (currentUserStats[character].currentGameStats && currentUserStats[character].currentGameStats.hasOwnProperty('touchWrongGuesses')) {
        currentUserStats[character].currentGameStats.wrongGuesses = currentUserStats[character].currentGameStats.touchWrongGuesses;
        delete currentUserStats[character].currentGameStats.touchWrongGuesses;
      }
      // Initialize new fields if they don't exist
      if (!currentUserStats[character].hasOwnProperty('totalWrongSubmissions')) {
        currentUserStats[character].totalWrongSubmissions = 0;
      }
      if (!currentUserStats[character].hasOwnProperty('totalEditCount')) {
        currentUserStats[character].totalEditCount = 0;
      }
    }

    // Ensure currentGameStats exists
    if (!currentUserStats[character].currentGameStats) {
        currentUserStats[character].currentGameStats = { rightGuesses: 0, wrongGuesses: 0, wrongSubmissions: 0, editCount: 0, totalResponseTime: 0, askForHelpCounter: 0 };
    }
    // Ensure new fields exist in currentGameStats
    if (!currentUserStats[character].currentGameStats.hasOwnProperty('wrongSubmissions')) {
      currentUserStats[character].currentGameStats.wrongSubmissions = 0;
    }
    if (!currentUserStats[character].currentGameStats.hasOwnProperty('editCount')) {
      currentUserStats[character].currentGameStats.editCount = 0;
    }
     // Ensure dailyPerformance array exists
    if (!currentUserStats[character].dailyPerformance) {
        currentUserStats[character].dailyPerformance = [];
    }

    // Update currentGameStats
    if (guessType === "correct") {
      let responseTime = currentTime - kanaTimeToAnswerTimer;
      responseTime = Math.min(responseTime, 10000); // Cap response time at 10 seconds
      currentUserStats[character].currentGameStats.totalResponseTime += responseTime;
      currentUserStats[character].currentGameStats.rightGuesses++;
      // Update overall totals
      currentUserStats[character].totalRightGuesses = (currentUserStats[character].totalRightGuesses || 0) + 1;
      currentUserStats[character].totaltotalResponseTime = (currentUserStats[character].totaltotalResponseTime || 0) + responseTime;
    } else if (guessType === "wrong") {
      currentUserStats[character].currentGameStats.wrongGuesses++;
      currentUserStats[character].totalWrongGuesses = (currentUserStats[character].totalWrongGuesses || 0) + 1;
    } else if (guessType === "wrongSubmission") {
      currentUserStats[character].currentGameStats.wrongSubmissions++;
      currentUserStats[character].totalWrongSubmissions = (currentUserStats[character].totalWrongSubmissions || 0) + 1;
    } else if (guessType === "edit") {
      currentUserStats[character].currentGameStats.editCount++;
      currentUserStats[character].totalEditCount = (currentUserStats[character].totalEditCount || 0) + 1;
    } else if (guessType === "askForHelp") {
      currentUserStats[character].currentGameStats.askForHelpCounter++;
      currentUserStats[character].totalAskForHelpCounter = (currentUserStats[character].totalAskForHelpCounter || 0) + 1;
    }

    // Update dailyPerformance
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Get timestamp for midnight
    const todayTimestamp = today.getTime();

    let dailyEntry = currentUserStats[character].dailyPerformance.find(entry => entry.date === todayTimestamp);

    if (!dailyEntry) {
      dailyEntry = {
        date: todayTimestamp,
        rightGuesses: 0,
        wrongGuesses: 0,
        wrongSubmissions: 0,
        editCount: 0,
        askForHelpCounter: 0,
        responseTimeSum: 0.0
      };
      currentUserStats[character].dailyPerformance.push(dailyEntry);
    }

    if (guessType === "correct") {
      let responseTime = currentTime - kanaTimeToAnswerTimer;
      responseTime = Math.min(responseTime, 10000); // Cap response time at 10 seconds
      dailyEntry.rightGuesses++;
      dailyEntry.responseTimeSum += responseTime;
    } else if (guessType === "wrong") {
      dailyEntry.wrongGuesses++;
    } else if (guessType === "wrongSubmission") {
      dailyEntry.wrongSubmissions++;
    } else if (guessType === "edit") {
      dailyEntry.editCount++;
    } else if (guessType === "askForHelp") {
      dailyEntry.askForHelpCounter++;
    }

    localStorage.setItem('userStats', JSON.stringify(currentUserStats));
  }


  // Function gets called at the beginning and every time the kana changes
  async function showNewCharacter() {
    setSrsCardRevealed(false);

    // Check if the user already answered its kana limits. If so, show stats.
    const gameScoreElement = document.getElementById("in-game-score");
    const gameMode = JSON.parse(localStorage.getItem("gameMode"));
    if (!isSrsPractice && gameMode && gameMode.type === "kana-selector" && gameMode.value !== -1 &&
        gameScoreElement &&
        parseInt(gameScoreElement.textContent.replace(/^\D+/g, ''), 10) >= gameMode.value) {
      setUserGameScoreWindowVisible(true);
      return; // Exit early if score window is shown
    }

    const kanaElement = document.querySelector('#in-game-kana-character');
    if (kanaElement) {
      kanaElement.classList.remove("answer-correct");
    }

    // Never carry the previous character's answer or meaning into the next question.
    document.querySelector('#in-game-kana-solution')?.classList.add('hidden-element');
    document.querySelector('#in-game-kanji-usage')?.classList.add('hidden-element');
    document.querySelector('#in-game-solution')?.classList.add('hidden-element');

    // Get and show the current Kana using the weighted selection logic
    let pickedElement = isSrsPractice
      ? srsQueueRef.current?.shift()
      : await selectNextCharacter(charactersToShow);
    
    if (!pickedElement) {
      if (isSrsPractice) {
        setUserGameScoreWindowVisible(true);
        return;
      }
      console.warn("selectNextCharacter returned undefined. Fallback to random selection from charactersToShow.");
      if (charactersToShow.length > 0) {
        pickedElement = charactersToShow[Math.floor(Math.random() * charactersToShow.length)];
      } else {
        navigate('/bruh', { state: { message: t('gameErrorNoCharacters') } });
        return;
      }
    }
    
    inGameKanaOnScreen = pickedElement.jp_character;
    currentCharacterTypeRef.current = pickedElement.type;
    srsFailedRef.current = false;
    srsCurrentCardRef.current = isSrsPractice ? pickedElement : null;
    setOnScreenCharacterType(pickedElement.type);

    // Update totalTimesShown
    let currentUserStats = JSON.parse(localStorage.getItem('userStats')) || {};
    if (!currentUserStats[inGameKanaOnScreen]) {
      currentUserStats[inGameKanaOnScreen] = {
        totalTimesShown: 1,
        totalRightGuesses: 0,
        totalWrongGuesses: 0,
        totalWrongSubmissions: 0,
        totalEditCount: 0,
        totaltotalResponseTime: 0,
        totalAskForHelpCounter: 0,
        currentGameStats: { rightGuesses: 0, wrongGuesses: 0, wrongSubmissions: 0, editCount: 0, totalResponseTime: 0, askForHelpCounter: 0 },
        dailyPerformance: [],
      };
    } else {
      currentUserStats[inGameKanaOnScreen].totalTimesShown = (currentUserStats[inGameKanaOnScreen].totalTimesShown || 0) + 1;
       // Ensure dailyPerformance exists for older data structures
      if (!currentUserStats[inGameKanaOnScreen].dailyPerformance) {
        currentUserStats[inGameKanaOnScreen].dailyPerformance = [];
      }
       // Handle migration for totalWrongGuesses if necessary from an even older state (pre-totalTouchWrongGuesses)
      if (!currentUserStats[inGameKanaOnScreen].hasOwnProperty('totalWrongGuesses') && !currentUserStats[inGameKanaOnScreen].hasOwnProperty('totalTouchWrongGuesses')) {
        currentUserStats[inGameKanaOnScreen].totalWrongGuesses = 0;
      }
      // Initialize new fields if they don't exist
      if (!currentUserStats[inGameKanaOnScreen].hasOwnProperty('totalWrongSubmissions')) {
        currentUserStats[inGameKanaOnScreen].totalWrongSubmissions = 0;
      }
      if (!currentUserStats[inGameKanaOnScreen].hasOwnProperty('totalEditCount')) {
        currentUserStats[inGameKanaOnScreen].totalEditCount = 0;
      }
    }
    localStorage.setItem('userStats', JSON.stringify(currentUserStats));

    const useKanjiUsageQuestion = !isSrsPractice &&
      pickedElement.type === 'kanji' &&
      pickedElement.usage &&
      practiceMode === 'mixed' &&
      Math.random() < 0.5;
    const questionCharacter = useKanjiUsageQuestion
      ? pickedElement.usage.word
      : pickedElement.jp_character;
    setKana(questionCharacter);
    setOnScreenParticles(
      pickedElement.type === 'long' && Array.isArray(pickedElement.particles)
        ? pickedElement.particles
        : []
    );
    const charTextElement = document.querySelector("#in-game-kana-character>p");
    if (charTextElement) {
      const displayLength = [...questionCharacter].length;
      const showReadingHints = useKanjiUsageQuestion &&
        localStorage.getItem('game-mode-kanji-readings') === 'true';
      charTextElement.dataset.displayLength = String(displayLength);
      charTextElement.style.fontSize = showReadingHints
        ? `min(35vh, ${72 / displayLength}vw)`
        : "35vh";
      charTextElement.setAttribute("data-word-wraped", "false");
    }
    setOnScreenKanjiUsage(pickedElement.type === 'kanji' ? pickedElement.usage : null);
    setIsKanjiUsageQuestion(Boolean(useKanjiUsageQuestion));
    // @ts-ignore
    const readings = Array.isArray(pickedElement.romanji) ? pickedElement.romanji : [pickedElement.romanji];
    const answerReadings = useKanjiUsageQuestion
      ? [pickedElement.usage.romanji]
      : readings;
    const acceptedAnswers = pickedElement.type === 'kanji'
      ? answerReadings.flatMap(reading => [reading, toHiragana(reading)])
      : answerReadings;
    inGameAnswerListRef.current = acceptedAnswers
      .map(normalizeAnswer)
      .filter(Boolean);
    // @ts-ignore
    setSolution(pickedElement.type === 'kanji' ? answerReadings : pickedElement.romanji);
    // @ts-ignore
    if (useKanjiUsageQuestion) {
      setWordMeaning(meaningOf(pickedElement.usage.word, pickedElement.usage.meaning));
    } else if (pickedElement.type === "word" || pickedElement.type === "kanji" ||
               pickedElement.type === "long") {
      // @ts-ignore
      setWordMeaning(meaningOf(pickedElement.jp_character, pickedElement.meaning));
    } else {
      setWordMeaning('');
    }

    const charDisplayElement = document.querySelector('#in-game-kana-character');
    if (charDisplayElement) {
      Array.from(charDisplayElement.classList)
        .filter(cls => cls.startsWith('font-'))
        .forEach(cls => charDisplayElement.classList.remove(cls));

      if (localStorage.getItem("game-mode-random-fonts") === "true") {
        const randomFontIndex = Math.floor(Math.random() * fontClassList.length);
        const fontClass = fontClassList[randomFontIndex];
        charDisplayElement.classList.add("font-" + fontClass);
      } else if (isMacOS) {
        charDisplayElement.classList.add("font-forceDefault");
      }
    }

    if (useTouchAnswers) {
      // @ts-ignore
      fillTouchAnswers({ ...pickedElement, romanji: answerReadings });
    }

    kanaTimeToAnswerTimer = Date.now();

  }

  function advanceToNextKanji() {
    if (!waitingForKanjiNextRef.current) return;
    window.clearTimeout(kanjiAutoAdvanceTimeoutRef.current);
    kanjiAutoAdvanceTimeoutRef.current = null;

    const beforeCursor = document.querySelector('#in-game-text-input-before-cursor');
    const afterCursor = document.querySelector('#in-game-text-input-after-cursor');
    const cursorGroup = document.querySelector('#in-game-text-input-cursor-group');
    const hiddenInput = document.querySelector('#in-game-text-input');
    if (beforeCursor) beforeCursor.textContent = '';
    if (afterCursor) afterCursor.textContent = '';
    if (cursorGroup) cursorGroup.classList.remove('answer-correct', 'answer-wrong');
    if (hiddenInput) hiddenInput.value = '';

    waitingForKanjiNextRef.current = false;
    document.querySelector('#in-game-kana-solution')?.classList.add('hidden-element');
    document.querySelector('#in-game-kanji-usage')?.classList.add('hidden-element');
    document.querySelector('#in-game-next-button')?.classList.add('hidden-element');
    showNewCharacter();
  }

  function showKanjiAnswer(showNextButton = true) {
    document.querySelector('#in-game-kana-solution')?.classList.add('hidden-element');
    document.querySelector('#in-game-solution')?.classList.remove('hidden-element');
    document.querySelector('#in-game-kanji-usage')?.classList.remove('hidden-element');
    document.querySelector('#in-game-next-button')?.classList.toggle('hidden-element', !showNextButton);
  }

  function rateSrsCard(remembered) {
    const card = srsCurrentCardRef.current;
    if (!isSrsPractice || !card || waitingForKanjiNextRef.current) return;

    recordKanjiSrsAnswer(card.jp_character, remembered);
    updateCurrentGameStats(remembered ? 'correct' : 'wrong');
    if (remembered) {
      setScore(score => score + 1);
    }

    srsCurrentCardRef.current = null;
    setSrsCardRevealed(false);
    setSrsCardDragOffset(0);
    setSrsCardSwipeDirection(null);
    showNewCharacter();
  }

  function handleSrsCardPointerDown(event) {
    if (srsCardSwipeDirection) return;
    srsCardPointerStartRef.current = event.clientX;
    srsCardDraggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSrsCardPointerMove(event) {
    if (srsCardPointerStartRef.current === null || srsCardSwipeDirection) return;
    const offset = event.clientX - srsCardPointerStartRef.current;
    if (Math.abs(offset) > 6) srsCardDraggedRef.current = true;
    setSrsCardDragOffset(offset);
  }

  function handleSrsCardPointerUp(event) {
    if (srsCardPointerStartRef.current === null) return;
    const offset = event.clientX - srsCardPointerStartRef.current;
    srsCardPointerStartRef.current = null;
    if (srsCardSwipeDirection) {
      setSrsCardDragOffset(0);
      return;
    }
    if (Math.abs(offset) >= 140) {
      setSrsCardSwipeDirection(offset < 0 ? 'left' : 'right');
      return;
    }
    setSrsCardDragOffset(0);
  }

  /* 
  #######################
  # Text input handlers #
  #######################
  */
  // Timer countdown effect
  React.useEffect(() => {
    const gameMode = JSON.parse(localStorage.getItem("gameMode"));

    // Initialize timer if in time-selector mode
    if (gameMode && gameMode.type === "time-selector" && gameMode.value !== -1) {
      setRemainingTime(gameMode.value * 60); // Convert minutes to seconds
    }
  }, []);

  React.useEffect(() => {
    const gameMode = JSON.parse(localStorage.getItem("gameMode"));

    // Only run timer if in time-selector mode
    if (gameMode && gameMode.type === "time-selector" && remainingTime !== null) {
      if (remainingTime <= 0) {
        setUserGameScoreWindowVisible(true);
        return;
      }

      const timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  React.useEffect(() => {
    let timeoutInProgress = false;
    let wrongSubmissionCounted = false; // A mistake counts at most once per kana shown

    // Keep the hidden <input> in sync with the displayed answer, so mobile
    // keyboards (which edit the input's value directly) see the same text
    function syncHiddenInput() {
      const hiddenInput = document.querySelector('#in-game-text-input');
      if (!hiddenInput) return;
      hiddenInput.value = document.querySelector('#in-game-text-input-before-cursor').textContent +
        document.querySelector('#in-game-text-input-after-cursor').textContent;
    }

    function clearAnswerInput() {
      document.querySelector('#in-game-text-input-before-cursor').textContent = '';
      document.querySelector('#in-game-text-input-after-cursor').textContent = '';
      document.querySelector('#in-game-text-input-cursor-group').classList.remove("answer-correct", "answer-wrong");
      // Restore the default size right away for the next character
      fitTypedAnswerFontSize();
      syncHiddenInput();
    }

    // Mobile virtual keyboards (e.g. Android Gboard) send keydown events with
    // key "Unidentified", so typed text is read from the input event instead
    function handleInput(e) {
      if (scoreWindowVisibleRef.current || waitingForKanjiNextRef.current) return;
      const InGameTextInput = document.querySelector('#in-game-text-input-before-cursor');
      const InGameTextInputAfterCursor = document.querySelector('#in-game-text-input-after-cursor');
      const previousAnswer = InGameTextInput.textContent + InGameTextInputAfterCursor.textContent;
      let newAnswer = e.target.value;

      if (newAnswer.includes('?')) {
        newAnswer = newAnswer.replace(/\?/g, '');
        e.target.value = newAnswer;
        handleUserAskForHelp();
      }

      InGameTextInput.textContent = newAnswer;
      InGameTextInputAfterCursor.textContent = '';
      InGameTextInputAfterCursor.style.visibility = "hidden";
      document.querySelector('#in-game-text-input-cursor-group').classList.remove('answer-wrong');

      if (newAnswer.length < previousAnswer.length) {
        updateCurrentGameStats("edit");
      } else if (newAnswer === previousAnswer) {
        return;
      }
      checkAnswer();
    }

    function handleKeyDown(e) {
      if (scoreWindowVisibleRef.current) return;
      if (waitingForKanjiNextRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          advanceToNextKanji();
        }
        return;
      }
      // Let the input event handle keys coming from mobile IMEs
      if (e.key === 'Unidentified' || e.isComposing || e.keyCode === 229) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentAnswer =
          document.querySelector('#in-game-text-input-before-cursor').textContent +
          document.querySelector('#in-game-text-input-after-cursor').textContent;
        if (currentCharacterTypeRef.current === 'kanji' && /[\u3040-\u30ff]/.test(currentAnswer)) {
          checkAnswer(true);
        }
        return;
      }

      const hiddenInput = document.querySelector('#in-game-text-input');
      const isTextEdit = e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete';
      if (e.target === hiddenInput && isTextEdit) return;

      // Check if key is a printable character and append it to the input field
      const InGameTextInput = document.querySelector('#in-game-text-input-before-cursor');
      const InGameTextInputAfterCursor = document.querySelector('#in-game-text-input-after-cursor');

      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
        // The displayed answer is managed manually, don't let the hidden input change on its own
        e.preventDefault();
      }

      if (e.key.match(/^[^?]$/)) {
        InGameTextInput.textContent += e.key;
      } else if (e.key === 'Backspace') {
        InGameTextInput.textContent = InGameTextInput.textContent.slice(0, -1);
        // Track edit
        updateCurrentGameStats("edit");
      } else if (e.key === 'Shift') {
        const charDisplayElement = document.querySelector('#in-game-kana-character');
        charDisplayElement.classList.add("font-forceDefault");
        if (!isMacOS || localStorage.getItem("game-mode-random-fonts") === "true") {
          setTimeout(function () {
            charDisplayElement.classList.remove("font-forceDefault");
          }, 1500)
        }
      } else if (e.key === 'Escape') {
        setUserGameScoreWindowVisible(true);
      } else if (e.key === '?') {
        handleUserAskForHelp()
      } else if (e.key === 'ArrowLeft') {
        if (InGameTextInput.textContent.length > 0) {
          InGameTextInputAfterCursor.textContent = InGameTextInput.textContent.slice(-1) + InGameTextInputAfterCursor.textContent;
          InGameTextInput.textContent = InGameTextInput.textContent.slice(0, -1);
          InGameTextInputAfterCursor.style.visibility = "visible";
        }
      } else if (e.key === 'ArrowRight') {
        InGameTextInput.textContent = InGameTextInput.textContent + InGameTextInputAfterCursor.textContent.slice(0, 1);
        InGameTextInputAfterCursor.textContent = InGameTextInputAfterCursor.textContent.slice(1);
        if (InGameTextInputAfterCursor.textContent.length === 0) {
          InGameTextInputAfterCursor.style.visibility = "hidden";
        }
      } else if (e.key === 'Delete') {
        if (InGameTextInputAfterCursor.textContent.length > 0) {
          InGameTextInputAfterCursor.textContent = InGameTextInputAfterCursor.textContent.slice(1);
          // Track edit
          updateCurrentGameStats("edit");
        }
      }

      syncHiddenInput();
      document.querySelector('#in-game-text-input-cursor-group').classList.remove('answer-wrong');
      checkAnswer();
    }

    function checkAnswer(isSubmission = false) {
      const InGameTextInput = document.querySelector('#in-game-text-input-before-cursor');
      const InGameTextInputAfterCursor = document.querySelector('#in-game-text-input-after-cursor');
      const InGameUserCurrentAnswer = InGameTextInput.textContent + InGameTextInputAfterCursor.textContent;
      const typedAnswer = normalizeAnswer(InGameUserCurrentAnswer);
      if (!typedAnswer) return;

      const isKanaInput = currentCharacterTypeRef.current === 'kanji' &&
        /[\u3040-\u30ff]/.test(InGameUserCurrentAnswer);
      if (isKanaInput && !isSubmission) return;

      const answerGroup = document.querySelector('#in-game-text-input-cursor-group');
      const isCorrect = inGameAnswerListRef.current.includes(typedAnswer);
      const isOnTrack = isSubmission
        ? isCorrect
        : inGameAnswerListRef.current.some(answer => answer.startsWith(typedAnswer));
      if (!isOnTrack) {
        setStreak(0);
      }
      answerGroup.classList.toggle("answer-wrong", !isOnTrack && hintsEnabled);

      if (!isOnTrack && !wrongSubmissionCounted) {
        updateCurrentGameStats("wrongSubmission");
        wrongSubmissionCounted = true;
        if (isSrsPractice && currentCharacterTypeRef.current === 'kanji') {
          recordKanjiSrsAnswer(inGameKanaOnScreen, false);
          srsFailedRef.current = true;
        }
      }


      ///////////////////////////////////////////////////////////////
      //////////// If the user types the correct answer! ////////////
      ///////////////////////////////////////////////////////////////

      if (timeoutInProgress) return;
      //  Make that known and pass to the next character
      if (isCorrect) {
        updateCurrentGameStats("correct");
        if (isSrsPractice && currentCharacterTypeRef.current === 'kanji' && !srsFailedRef.current) {
          recordKanjiSrsAnswer(inGameKanaOnScreen, true);
        }
        answerGroup.classList.add("answer-correct");
        document.querySelector('#in-game-kana-character').classList.add("answer-correct");
        wrongSubmissionCounted = false; // Reset for next character
        setScore(prevScore => prevScore + 1)

        // Long answers (words and sentences) wait for the player:
        // reveal the romanji (and translation) and show the Next button
        if (currentCharacterTypeRef.current === 'word' || currentCharacterTypeRef.current === 'long') {
          if (!document.querySelector('#in-game-kana-solution').classList.contains("hidden-element")) {
            document.querySelector('#in-game-kana-solution').classList.add("hidden-element");
          }
          document.querySelector('#in-game-solution').classList.remove("hidden-element");

          if (!autoNext) {
            const solutionElement = document.querySelector('#in-game-solution');
            const nextButton = document.querySelector('#in-game-next-button');
            nextButton.classList.remove("hidden-element");
            const goToNextWord = () => {
              clearAnswerInput();
              solutionElement.classList.add("hidden-element");
              nextButton.classList.add("hidden-element");
              showNewCharacter();

              // Remove the listeners to prevent multiple listeners from being added
              document.removeEventListener('keydown', handleKeyDown);
              solutionElement.removeEventListener('click', goToNextWord);
              nextButton.removeEventListener('click', goToNextWord);
            };
            // Define the function for keydown event
            const handleKeyDown = (event) => {
              if (event.key === 'Enter' && !scoreWindowVisibleRef.current) {
                goToNextWord();
              }
            };

            // Listen for 'Enter' key press, or a tap on the translation / Next button (mobile)
            document.addEventListener('keydown', handleKeyDown);
            solutionElement.addEventListener('click', goToNextWord);
            nextButton.addEventListener('click', goToNextWord);
          } else {
            timeoutInProgress = true;
            setTimeout(function () {
              clearAnswerInput();
              document.querySelector('#in-game-solution').classList.add("hidden-element");
              showNewCharacter();
              timeoutInProgress = false;
            }, 1000);
          }
        }
        else {
          if (currentCharacterTypeRef.current === 'kanji') {
            if (isSrsPractice && !srsFailedRef.current) {
              recordKanjiSrsAnswer(inGameKanaOnScreen, true);
            }
            waitingForKanjiNextRef.current = true;
            showKanjiAnswer(!autoNext);
            if (autoNext) {
              timeoutInProgress = true;
              kanjiAutoAdvanceTimeoutRef.current = window.setTimeout(() => {
                clearAnswerInput();
                waitingForKanjiNextRef.current = false;
                document.querySelector('#in-game-solution').classList.add('hidden-element');
                document.querySelector('#in-game-kana-solution').classList.add('hidden-element');
                document.querySelector('#in-game-kanji-usage').classList.add('hidden-element');
                document.querySelector('#in-game-next-button').classList.add('hidden-element');
                showNewCharacter();
                kanjiAutoAdvanceTimeoutRef.current = null;
                timeoutInProgress = false;
              }, 700);
            }
          } else {
            // Kana continues to advance automatically.
            setTimeout(function () {
              clearAnswerInput();
              showNewCharacter();
            }, 200)
          }
        }
      }
    }
    if (!isSrsPractice && localStorage.getItem("game-mode-touch") !== "true") {
      const hiddenInput = document.querySelector('#in-game-text-input');
      if (!hiddenInput) return;

      window.addEventListener('keydown', handleKeyDown);
      hiddenInput.addEventListener('input', handleInput);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        hiddenInput.removeEventListener('input', handleInput);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the game screen the size of the visible area, so the on-screen keyboard
  // never covers the answer (needed for iOS, which ignores interactive-widget)
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add('in-game-scroll-lock');
    const viewport = window.visualViewport;
    function updateAppHeight() {
      root.style.setProperty('--app-height', viewport.height + 'px');
      window.scrollTo(0, 0);
    }
    if (viewport) {
      updateAppHeight();
      viewport.addEventListener('resize', updateAppHeight);
    }
    return () => {
      root.classList.remove('in-game-scroll-lock');
      root.style.removeProperty('--app-height');
      if (viewport) {
        viewport.removeEventListener('resize', updateAppHeight);
      }
    };
  }, []);

  // The background gets slightly lighter the longer the streak (max at 10 in a row)
  React.useEffect(() => {
    const container = document.querySelector('.in-game-container');
    if (container) {
      container.style.setProperty('--streak-level', Math.min(streak, 10) * 5 + '%');
    }
    setBestStreak(prevBest => Math.max(prevBest, streak));
  }, [streak]);

  // Once the summary is open the game stops taking answers, and the mobile keyboard is closed
  React.useEffect(() => {
    scoreWindowVisibleRef.current = userGameScoreWindowVisible;
    if (userGameScoreWindowVisible) {
      const hiddenInput = document.querySelector('#in-game-text-input');
      if (hiddenInput) {
        hiddenInput.blur();
      }
    }
  }, [userGameScoreWindowVisible]);

  // Keep long answers (words, sentences) inside the input line: when the
  // typed text grows wider than the field, shrink the text and the cursor so
  // the whole answer stays visible instead of being clipped at the edges
  function fitTypedAnswerFontSize() {
    try {
      const cursorGroup = document.querySelector('#in-game-text-input-cursor-group');
      const cursor = document.querySelector('#in-game-text-input-cursor');
      const beforeCursor = document.querySelector('#in-game-text-input-before-cursor');
      const afterCursor = document.querySelector('#in-game-text-input-after-cursor');
      if (!cursorGroup || !cursor || !beforeCursor || !afterCursor) {
        return;
      }
      // Back to the CSS sizes first, to measure the natural text width
      beforeCursor.style.fontSize = '';
      afterCursor.style.fontSize = '';
      cursor.style.height = '';
      const textWidth = beforeCursor.scrollWidth + afterCursor.scrollWidth;
      // Nothing typed (also the case in jsdom, which has no layout)
      if (!textWidth) {
        return;
      }
      // clientWidth includes the 5px padding on both sides; the cursor is
      // 3px wide with -6px of margins, plus a small safety margin
      const availableWidth = cursorGroup.clientWidth - 14;
      if (availableWidth <= 0 || textWidth <= availableWidth) {
        return;
      }
      // Same values as the CSS: text min(13vh, 11vw), cursor height min(11.5vh, 10vw)
      const ratio = availableWidth / textWidth;
      const fontSize = `min(${(13 * ratio).toFixed(2)}vh, ${(11 * ratio).toFixed(2)}vw)`;
      beforeCursor.style.fontSize = fontSize;
      afterCursor.style.fontSize = fontSize;
      cursor.style.height = `min(${(11.5 * ratio).toFixed(2)}vh, ${(10 * ratio).toFixed(2)}vw)`;
    } catch (error) { }
  }

  const cursorBlinkInterval = useRef(null);
  React.useEffect(() => {
    function getFontSizeInVH(element) {
      const computedStyles = window.getComputedStyle(element);
      const fontSizeInPixels = parseFloat(computedStyles.fontSize);
      const viewportHeight = window.innerHeight;
      const fontSizeInVh = (fontSizeInPixels / viewportHeight) * 100;
      return fontSizeInVh;
    }
    function onLineWrapDoSomething() {
      try {
        const kanaCharacter = document.querySelector("#in-game-kana-character>p")
        // kanaCharacter.style.fontSize = "35vh";
        const lineHeight = window.getComputedStyle(kanaCharacter).getPropertyValue('font-size');
        const lineHeightParsed = parseInt(lineHeight.split('px')[0]);
        const amountOfLinesTilAdjust = 2;
        const isWraped = kanaCharacter.getAttribute("data-word-wraped") === "true"
        const displayLength = Number(kanaCharacter.dataset.displayLength) || kanaCharacter.textContent.length;
        if (isWraped & getFontSizeInVH(kanaCharacter) >= 35) {
          kanaCharacter.style.fontSize = "35vh";
          kanaCharacter.setAttribute("data-word-wraped", "false")
        }
        else if (isWraped) {
          kanaCharacter.style.fontSize = (90 / displayLength) + "vw";
          kanaCharacter.setAttribute("data-word-wraped", "true")
        } else if (!isWraped & kanaCharacter.offsetHeight >= (lineHeightParsed * amountOfLinesTilAdjust)) {
          kanaCharacter.style.fontSize = (90 / displayLength) + "vw";
          kanaCharacter.setAttribute("data-word-wraped", "true")
        }
      } catch (error) { }
    }

    // window.addEventListener('resize', onLineWrapDoSomething)

    //handles style changes on banner to check wrapping
    const lineWrapInterval = setInterval(() => {
      onLineWrapDoSomething();
      // Also keep the typed answer fitting inside the input line
      fitTypedAnswerFontSize();
    }, 100)

    function handleFocus() {
      document.querySelector('#in-game-text-input').focus();
      cursorBlinkInterval.current = window.setInterval(function () {
        try {
          if (document.querySelector('#in-game-text-input-cursor').style.visibility === 'visible') {
            document.querySelector('#in-game-text-input-cursor').style.visibility = 'hidden';
          } else {
            document.querySelector('#in-game-text-input-cursor').style.visibility = 'visible';
          }
        } catch (error) {

        }
      }, 700);
    }
    if (!isSrsPractice && localStorage.getItem("game-mode-touch") !== "true") {
      handleFocus();
    }
    if (!hasStartedInitialCharacterRef.current) {
      hasStartedInitialCharacterRef.current = true;
      resetCurentGameStats();
      showNewCharacter();
    }
    return () => {
      clearInterval(cursorBlinkInterval.current);
      clearInterval(lineWrapInterval);
      window.clearTimeout(kanjiAutoAdvanceTimeoutRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUserAskForHelp() {
    if (!hintsEnabled) {
      return;
    }
    if (document.querySelector('#in-game-kana-solution').classList.contains("hidden-element")) {
      updateCurrentGameStats('askForHelp')
      document.querySelector('#in-game-kana-solution').classList.remove("hidden-element")
    }
  }

  /* 
  ########################
  # Touch input handlers #
  ########################
  */
  function onClickAnswerButtonHandler(event) {
    if (waitingForKanjiNextRef.current || scoreWindowVisibleRef.current) return;

    if (onScreenSolution.includes(event.target.firstChild.textContent)) {
      updateCurrentGameStats("correct");
      const answerButton = event.currentTarget;
      answerButton.classList.add("touch-answer-correct");
      setTimeout(function () {
        answerButton.classList.remove("touch-answer-correct");
      }, 300);
      setScore(onScreenScore + 1)
      if (currentCharacterTypeRef.current === 'kanji') {
        if (isSrsPractice && !srsFailedRef.current) {
          recordKanjiSrsAnswer(inGameKanaOnScreen, true);
        }
        waitingForKanjiNextRef.current = true;
        showKanjiAnswer(!autoNext);
        if (autoNext) {
          kanjiAutoAdvanceTimeoutRef.current = window.setTimeout(() => {
            waitingForKanjiNextRef.current = false;
            document.querySelector('#in-game-solution').classList.add('hidden-element');
            document.querySelector('#in-game-kana-solution').classList.add('hidden-element');
            document.querySelector('#in-game-kanji-usage').classList.add('hidden-element');
            document.querySelector('#in-game-next-button').classList.add('hidden-element');
            showNewCharacter();
            kanjiAutoAdvanceTimeoutRef.current = null;
          }, 700);
        }
      } else {
        showNewCharacter();
      }
    } else {
      updateCurrentGameStats("wrong");
      if (isSrsPractice && currentCharacterTypeRef.current === 'kanji' && !srsFailedRef.current) {
        recordKanjiSrsAnswer(inGameKanaOnScreen, false);
        srsFailedRef.current = true;
      }
      // Short haptic feedback on phones that support it (Android)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // Animate the element in ID in-game-kana-character using the class animation-wrong
      document.querySelector('#in-game-kana-character').classList.add("animation-wrong1");
      setTimeout(function () {
        document.querySelector('#in-game-kana-character').classList.remove("animation-wrong1");
      }, 300)
    }
  }

  function onClickChangeFontToDefault(event) {
    const charDisplayElement = document.querySelector('#in-game-kana-character');
    charDisplayElement.classList.add("font-forceDefault");
    if (!isMacOS || localStorage.getItem("game-mode-random-fonts") === "true") {
      setTimeout(function () {
        charDisplayElement.classList.remove("font-forceDefault");
      }, 1500)
    }
  }

  // Mobile browsers only open the virtual keyboard when the input is focused by a user tap
  function focusTextInput() {
    const hiddenInput = document.querySelector('#in-game-text-input');
    if (hiddenInput) hiddenInput.focus();
  }

  function onClickExitButton(event) {
    setUserGameScoreWindowVisible(true);
  }

  // Format time as MM:SS
  function formatTime(seconds) {
    if (seconds === null) return null;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate time percentage for styling
  function getTimePercentage() {
    const gameMode = JSON.parse(localStorage.getItem("gameMode"));
    if (!gameMode || gameMode.type !== "time-selector" || remainingTime === null) {
      return 100;
    }
    const totalSeconds = gameMode.value * 60;
    return (remainingTime / totalSeconds) * 100;
  }

  /* 
  ######################################################
  # Decide wether to use touch or keyboard for answers #
  ######################################################
  */

  // Make answer input via touch buttons
  let inGameInputElement = <></>
  if (useTouchAnswers) {
    function makeTouchAnswerDivs(params) {
      const numberOfAnswers = 5;
      const answerElements = [];

      for (let i = 0; i < numberOfAnswers; i++) {
        answerElements.push((
          <div key={'in-game-touch-answer-' + i} className='in-game-touch-answer' onClick={onClickAnswerButtonHandler}>
            <p></p>
          </div>
        ));
      }
      return answerElements;
    }

    inGameInputElement = <>
      <div className='in-game-touch-answer-group'>
        {
          makeTouchAnswerDivs()
        }
      </div>
    </>

    // Make answer input via keyboard
  } else if (!isSrsPractice) {
    inGameInputElement = <>
      <div id='in-game-text-input-cursor-group'>
        <span id='in-game-text-input-before-cursor'></span>
        <div id='in-game-text-input-cursor'></div>
        <span id='in-game-text-input-after-cursor'></span>
        <span id='in-game-text-input-placeholder'>
          {t(onScreenCharacterType === 'kanji' ? 'kanjiGamePlaceholder' : 'gamePlaceholder')}
        </span>
      </div>
      <input 
        type="text" 
        id='in-game-text-input' 
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        enterKeyHint="next"
      />
    </>
  }

  const kanjiSrsCardBack = (
    <div className='kanji-srs-card-back'>
      <div className='kanji-srs-card-meaning'>{onScreenWordMeaning}</div>
      <div className='kanji-answer-readings'>
        <span>
          <span className='kanji-answer-reading-label'>{t('kanjiOnShort')}</span>
          {kanjiReadings[onScreenKana]?.onyomi.map(reading => toHiragana(reading)).join(' ・ ') || '—'}
        </span>
        <span>
          <span className='kanji-answer-reading-label'>{t('kanjiKuShort')}</span>
          {kanjiReadings[onScreenKana]?.kunyomi.map(reading => toHiragana(reading)).join(' ・ ') || '—'}
        </span>
      </div>
      {onScreenKanjiUsage && (
        <div className='kanji-srs-card-example'>
          <strong>{onScreenKanjiUsage.word}</strong>
          <span>{onScreenKanjiUsage.romanji}</span>
          <span>{meaningOf(onScreenKanjiUsage.word, onScreenKanjiUsage.meaning)}</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="in-game-top-var">
        <div className='in-game-score-group'>
          <div className='in-game-score' id='in-game-score'>
            {isProblematicsMode ? t('gameScoreProblematics') : t('gameScoreKanas')}{onScreenScore}
            {kanaGoal !== null && <span className='in-game-score-goal'> / {kanaGoal}</span>}
          </div>
          {streak >= 3 && <div className='in-game-streak' title={t('gameStreakTitle')}>🔥 {streak}</div>}
        </div>
        {remainingTime !== null ? (
          <div
            className={`in-game-timer ${getTimePercentage() <= 10 ? 'timer-critical' : getTimePercentage() <= 25 ? 'timer-warning' : ''}`}
            id='in-game-timer'
          >
            {formatTime(remainingTime)}
          </div>
        ) : (
          <div className='in-game-help-bar'>
            {hintsEnabled ? <div className='in-game-help-button' onClick={handleUserAskForHelp}>
              <span className='label-keyboard'><strong>?</strong>: {t('gameHelpKey')}</span>
              <span className='label-touch'>{t('gameHintButton')}</span>
            </div> : null}
            {(localStorage.getItem("game-mode-random-fonts") === "true") ? <div className='in-game-help-button' onClick={onClickChangeFontToDefault}>
              <span className='label-keyboard'><strong>shift</strong>: {t('gameFontKey')}</span>
              <span className='label-touch'>{t('gameFontButton')}</span>
            </div> : <div></div>}
          </div>
        )}
        <div onClick={onClickExitButton} className='in-game-exit-button' title={t('gameEnd')}>✖</div>
      </div>
      {kanaGoal !== null && (
        <div className='in-game-progress'>
          <div className='in-game-progress-fill' style={{ width: Math.min(onScreenScore / kanaGoal, 1) * 100 + '%' }}></div>
        </div>
      )}
      <div className='in-game-game-screen' onClick={focusTextInput}>

        <div className='in-game-kana-area'>
          {isSrsPractice ? (
            <div
              id='in-game-kana-character'
              className={`in-game-kana-character kanji-srs-flip-card${isMacOS && localStorage.getItem("game-mode-random-fonts") !== "true" ? ' font-forceDefault' : ''}`}
              style={{
                transform: srsCardSwipeDirection
                  ? `translate3d(${srsCardSwipeDirection === 'left' ? '-120vw' : '120vw'}, 0, 0) rotate(${srsCardSwipeDirection === 'left' ? '-8deg' : '8deg'})`
                  : srsCardDragOffset !== 0
                    ? `translate3d(${srsCardDragOffset}px, 0, 0)`
                    : undefined
              }}
              onPointerDown={handleSrsCardPointerDown}
              onPointerMove={handleSrsCardPointerMove}
              onPointerUp={handleSrsCardPointerUp}
              onPointerCancel={handleSrsCardPointerUp}
              onClick={() => {
                if (srsCardDraggedRef.current) {
                  srsCardDraggedRef.current = false;
                  return;
                }
                setSrsCardRevealed(revealed => !revealed);
              }}
              onTransitionEnd={event => {
                if (event.target !== event.currentTarget || event.propertyName !== 'transform' || !srsCardSwipeDirection) return;
                rateSrsCard(srsCardSwipeDirection === 'right');
              }}
            >
              <div className={`kanji-srs-flip-inner${srsCardRevealed ? ' is-flipped' : ''}`}>
                <div className='kanji-srs-flip-face kanji-srs-flip-front'>
                  <span>{onScreenKana}</span>
                </div>
                <div className='kanji-srs-flip-face kanji-srs-flip-back'>
                  {kanjiSrsCardBack}
                </div>
              </div>
            </div>
          ) : <div
            id='in-game-kana-character'
            onClick={onClickChangeFontToDefault}
            className={`in-game-kana-character${isMacOS && localStorage.getItem("game-mode-random-fonts") !== "true" ? ' font-forceDefault' : ''}`}
          >
            <p className={
              onScreenCharacterType === 'kanji' &&
              isKanjiUsageQuestion &&
              localStorage.getItem('game-mode-kanji-readings') === 'true'
                ? 'kanji-reading-question-prompt'
                : ''
            }>
              {onScreenCharacterType === 'kanji' &&
              isKanjiUsageQuestion &&
              localStorage.getItem('game-mode-kanji-readings') === 'true'
                ? [...onScreenKana].map((character, index) => kanjiReadings[character] ? (
                  <span
                    className={`kanji-reading-question ${index === 0 ? 'reading-left' : 'reading-right'}`}
                    key={`${character}-${index}`}
                  >
                    {index === 0 && (
                      <span className='kanji-reading-question-columns'>
                        <span className='kanji-reading-question-column'>
                          <span className='kanji-reading-question-label'>{t('kanjiOnShort')}</span>
                          {kanjiReadings[character].onyomi.length === 0
                            ? <span>—</span>
                            : kanjiReadings[character].onyomi.map((reading, readingIndex) => (
                            <span key={`on-${readingIndex}`}>{toHiragana(reading)}</span>
                          ))}
                        </span>
                        <span className='kanji-reading-question-column'>
                          <span className='kanji-reading-question-label'>{t('kanjiKuShort')}</span>
                          {kanjiReadings[character].kunyomi.length === 0
                            ? <span>—</span>
                            : kanjiReadings[character].kunyomi.map((reading, readingIndex) => (
                            <span key={`kun-${readingIndex}`}>{toHiragana(reading)}</span>
                          ))}
                        </span>
                      </span>
                    )}
                    <span className='kanji-reading-question-character'>{character}</span>
                    {index > 0 && (
                      <span className='kanji-reading-question-columns'>
                      <span className='kanji-reading-question-column'>
                        <span className='kanji-reading-question-label'>{t('kanjiOnShort')}</span>
                        {kanjiReadings[character].onyomi.length === 0
                          ? <span>—</span>
                          : kanjiReadings[character].onyomi.map((reading, readingIndex) => (
                          <span key={`on-${readingIndex}`}>{toHiragana(reading)}</span>
                        ))}
                      </span>
                      <span className='kanji-reading-question-column'>
                        <span className='kanji-reading-question-label'>{t('kanjiKuShort')}</span>
                        {kanjiReadings[character].kunyomi.length === 0
                          ? <span>—</span>
                          : kanjiReadings[character].kunyomi.map((reading, readingIndex) => (
                          <span key={`kun-${readingIndex}`}>{toHiragana(reading)}</span>
                        ))}
                      </span>
                      </span>
                    )}
                  </span>
                ) : character)
                : onScreenCharacterType === 'long' && onScreenParticles.length > 0
                  ? [...onScreenKana].map((character, index) => (
                    onScreenParticles.includes(index)
                      ? <span className='in-game-particle' key={`particle-${index}`}>{character}</span>
                      : character
                  ))
                  : onScreenKana}
            </p>
          </div>}
          <div id='in-game-solution' className='in-game-solution hidden-element'>
            <span className='in-game-solution-romanji'>{onScreenSolution[0]}</span>
            {onScreenWordMeaning ? (
              <>
                <span className='in-game-solution-separator'> · </span>
                {onScreenWordMeaning}
              </>
            ) : null}
            {onScreenCharacterType === 'kanji' &&
              !isKanjiUsageQuestion &&
              localStorage.getItem('game-mode-kanji-readings') === 'true' &&
              kanjiReadings[onScreenKana] && (
                <span className='kanji-answer-readings'>
                  <span>
                    <span className='kanji-answer-reading-label'>{t('kanjiOnShort')}</span>
                    {kanjiReadings[onScreenKana].onyomi.map(reading => toHiragana(reading)).join(' ・ ') || '—'}
                  </span>
                  <span>
                    <span className='kanji-answer-reading-label'>{t('kanjiKuShort')}</span>
                    {kanjiReadings[onScreenKana].kunyomi.map(reading => toHiragana(reading)).join(' ・ ') || '—'}
                  </span>
                </span>
              )}
          </div>
          <div id='in-game-kana-solution' className='in-game-solution hidden-element'>
            {Array.isArray(onScreenSolution) ? onScreenSolution.join(' / ') : onScreenSolution}
          </div>
          {onScreenKanjiUsage && (
            <div id='in-game-kanji-usage' className='in-game-solution in-game-kanji-usage hidden-element'>
              {!isKanjiUsageQuestion && <span className='kanji-usage-word'>{onScreenKanjiUsage.word}</span>}
              <span className='kanji-usage-romanji'>{onScreenKanjiUsage.romanji}</span>
            </div>
          )}
          <button id='in-game-next-button' className='in-game-next-button hidden-element' onClick={advanceToNextKanji}>
            {t('gameNext')}<span className='label-keyboard'> (Enter)</span>
          </button>
        </div>
        {!isSrsPractice && inGameInputElement}
        <div className='hidden-text-for-font-loading'>
          {
            // Go with a for loop over every font, and create an element p with a class of the font
            fontClassList.map((fontClass) => {
              return (
                <p className={"font-" + fontClass} key={"font-" + fontClass}>a</p>
              )
            })
          }
        </div>
      </div>
      <UserGameScoreWindow
        visible={userGameScoreWindowVisible}
        bestStreak={bestStreak}
      />
    </>
  )
}
